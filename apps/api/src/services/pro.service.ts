import { randomUUID } from 'node:crypto';
import { ERROR_CODES } from '@babloo/shared/errors';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../lib/errors';
import * as notificationService from './notification.service';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

function requiredTeamSize(teamType?: string | null, squadSize?: number | null) {
  if (teamType === 'duo') return 2;
  if (teamType === 'squad' && squadSize && squadSize > 0) return squadSize;
  return null;
}

function countFilledSlots(assignments: Array<{ status: string }>) {
  return assignments.filter((assignment) => assignment.status !== 'declined').length;
}

async function getProfessionalId(deps: Deps, userId: string) {
  const professional = await deps.db.professional.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!professional) {
    throw new NotFoundError(ERROR_CODES.PRO_NOT_FOUND, 'Professional profile not found');
  }

  return professional.id;
}

export async function getProfile(deps: Deps, userId: string) {
  const profile = await deps.db.professional.findUnique({ where: { userId } });
  if (!profile) {
    throw new NotFoundError(ERROR_CODES.PRO_NOT_FOUND, 'Professional profile not found');
  }
  return profile;
}

export async function toggleAvailability(
  deps: Deps,
  userId: string,
  available: boolean,
) {
  const proId = await getProfessionalId(deps, userId);

  return deps.db.professional.update({
    where: { id: proId },
    data: { isAvailable: available },
    select: { isAvailable: true },
  });
}

export async function getProOrders(
  deps: Deps,
  userId: string,
  input: { cursor?: string; limit?: number },
) {
  const proId = await getProfessionalId(deps, userId);
  const take = Math.min(Math.max(input.limit ?? 20, 1), 50) + 1;

  const assignments = await deps.db.orderAssignment.findMany({
    where: { professionalId: proId },
    orderBy: [{ assignedAt: 'desc' }, { id: 'desc' }],
    take,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    include: {
      order: {
        include: {
          detail: true,
          statusEvents: { orderBy: { seq: 'asc' } },
          client: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  const hasMore = assignments.length > take - 1;
  const page = hasMore ? assignments.slice(0, take - 1) : assignments;

  return {
    items: page.map((assignment) => ({
      ...assignment.order,
      assignmentStatus: assignment.status,
      assignmentId: assignment.id,
      isLead: assignment.isLead,
      assignedAt: assignment.assignedAt,
      confirmedAt: assignment.confirmedAt,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
  };
}

export async function getOpenSlots(deps: Deps, userId: string) {
  const pro = await deps.db.professional.findUnique({
    where: { userId },
    select: {
      id: true,
      isAvailable: true,
      skills: true,
    },
  });

  if (!pro) {
    throw new NotFoundError(ERROR_CODES.PRO_NOT_FOUND, 'Professional profile not found');
  }

  if (!pro.isAvailable) {
    return [];
  }

  const orders = await deps.db.order.findMany({
    where: {
      status: 'accepted',
      serviceType: { in: pro.skills },
      detail: {
        is: {
          teamType: { in: ['duo', 'squad'] },
        },
      },
      assignments: {
        some: { isLead: true, status: 'confirmed' },
        none: {
          professionalId: pro.id,
          status: { not: 'declined' },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      detail: true,
      assignments: {
        select: { status: true },
      },
      client: {
        select: { id: true, fullName: true },
      },
    },
  });

  return orders
    .map((order) => {
      const totalSlots = requiredTeamSize(order.detail?.teamType, order.detail?.squadSize);
      if (!totalSlots) return null;

      const filledSlots = countFilledSlots(order.assignments);
      if (filledSlots >= totalSlots) return null;

      return {
        ...order,
        filledSlots,
        totalSlots,
      };
    })
    .filter((order): order is NonNullable<typeof order> => Boolean(order));
}

export async function createJoinRequest(
  deps: Deps,
  orderId: string,
  userId: string,
) {
  const pro = await deps.db.professional.findUnique({
    where: { userId },
    select: { id: true, isAvailable: true, skills: true },
  });

  if (!pro) {
    throw new NotFoundError(ERROR_CODES.PRO_NOT_FOUND, 'Professional profile not found');
  }

  if (!pro.isAvailable) {
    throw new ConflictError(ERROR_CODES.PRO_NOT_AVAILABLE, 'Professional is unavailable');
  }

  return deps.db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        detail: true,
        assignments: true,
      },
    });

    if (!order) {
      throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
    }

    if (order.status !== 'accepted') {
      throw new ConflictError(ERROR_CODES.ORDER_INVALID_TRANSITION, 'Order not open for join');
    }

    if (!pro.skills.includes(order.serviceType)) {
      throw new ForbiddenError(ERROR_CODES.AUTH_FORBIDDEN, 'Skill mismatch');
    }

    const totalSlots = requiredTeamSize(order.detail?.teamType, order.detail?.squadSize);
    if (!totalSlots) {
      throw new ConflictError(ERROR_CODES.PRO_NO_OPEN_SLOTS, 'Order has no team slots');
    }

    const existing = order.assignments.find(
      (assignment) => assignment.professionalId === pro.id && assignment.status !== 'declined',
    );

    if (existing) {
      throw new ConflictError(ERROR_CODES.PRO_ALREADY_JOINED, 'Professional already joined');
    }

    const filledSlots = countFilledSlots(order.assignments);
    if (filledSlots >= totalSlots) {
      throw new ConflictError(ERROR_CODES.PRO_NO_OPEN_SLOTS, 'No open slots available');
    }

    const declined = order.assignments.find(
      (assignment) => assignment.professionalId === pro.id && assignment.status === 'declined',
    );

    if (declined) {
      return tx.orderAssignment.update({
        where: { id: declined.id },
        data: {
          status: 'assigned',
          confirmedAt: null,
          assignedAt: new Date(),
        },
      });
    }

    return tx.orderAssignment.create({
      data: {
        orderId,
        professionalId: pro.id,
        isLead: false,
        status: 'assigned',
      },
    });
  });
}

export async function getJoinRequests(deps: Deps, orderId: string, userId: string) {
  const proId = await getProfessionalId(deps, userId);

  const order = await deps.db.order.findUnique({
    where: { id: orderId },
    include: {
      assignments: {
        include: {
          professional: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
  }

  const isLead = order.assignments.some(
    (assignment) =>
      assignment.professionalId === proId &&
      assignment.isLead &&
      assignment.status === 'confirmed',
  );

  if (!isLead) {
    throw new ForbiddenError(ERROR_CODES.PRO_NOT_LEAD, 'Only lead can view requests');
  }

  return {
    pending: order.assignments.filter(
      (assignment) => !assignment.isLead && assignment.status === 'assigned',
    ),
    confirmed: order.assignments.filter(
      (assignment) => !assignment.isLead && assignment.status === 'confirmed',
    ),
  };
}

async function updateLeadManagedAssignment(
  deps: Deps,
  assignmentId: string,
  userId: string,
  nextStatus: 'confirmed' | 'declined',
) {
  const proId = await getProfessionalId(deps, userId);

  return deps.db.$transaction(async (tx) => {
    const assignment = await tx.orderAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        order: {
          include: {
            assignments: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError(ERROR_CODES.PRO_ASSIGNMENT_NOT_FOUND, 'Assignment not found');
    }

    const isLead = assignment.order.assignments.some(
      (entry) =>
        entry.professionalId === proId && entry.isLead && entry.status === 'confirmed',
    );

    if (!isLead) {
      throw new ForbiddenError(ERROR_CODES.PRO_NOT_LEAD, 'Only lead can manage requests');
    }

    if (assignment.isLead) {
      throw new ForbiddenError(ERROR_CODES.PRO_NOT_LEAD, 'Cannot manage lead assignment');
    }

    if (assignment.status !== 'assigned') {
      throw new ConflictError(
        ERROR_CODES.PRO_ASSIGNMENT_WRONG_STATUS,
        'Only pending assignments can be managed',
      );
    }

    return tx.orderAssignment.update({
      where: { id: assignment.id },
      data: {
        status: nextStatus,
        confirmedAt: nextStatus === 'confirmed' ? new Date() : null,
      },
    });
  });
}

export async function approveAssignment(deps: Deps, assignmentId: string, userId: string) {
  return updateLeadManagedAssignment(deps, assignmentId, userId, 'confirmed');
}

export async function rejectAssignment(deps: Deps, assignmentId: string, userId: string) {
  return updateLeadManagedAssignment(deps, assignmentId, userId, 'declined');
}

export async function confirmAssignment(deps: Deps, assignmentId: string, userId: string) {
  const proId = await getProfessionalId(deps, userId);

  const assignment = await deps.db.orderAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      order: {
        select: { id: true, clientId: true },
      },
    },
  });

  if (!assignment) {
    throw new NotFoundError(ERROR_CODES.PRO_ASSIGNMENT_NOT_FOUND, 'Assignment not found');
  }

  if (assignment.professionalId !== proId) {
    throw new ForbiddenError(ERROR_CODES.PRO_NOT_ASSIGNED, 'Not your assignment');
  }

  if (assignment.status !== 'assigned') {
    throw new ConflictError(ERROR_CODES.PRO_ASSIGNMENT_WRONG_STATUS, 'Assignment cannot be confirmed');
  }

  const updated = await deps.db.orderAssignment.update({
    where: { id: assignment.id },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
    },
  });

  await notificationService.notifyStatusChange(
    { db: deps.db, logger: deps.logger },
    {
      orderId: assignment.orderId,
      toStatus: 'accepted',
      correlationId: randomUUID(),
    },
  );

  await notificationService.notifyRatePrompt(
    { db: deps.db, logger: deps.logger },
    {
      orderId: assignment.order.id,
      clientUserId: assignment.order.clientId,
      correlationId: randomUUID(),
    },
  );

  return updated;
}

export async function declineAssignment(deps: Deps, assignmentId: string, userId: string) {
  const proId = await getProfessionalId(deps, userId);

  const assignment = await deps.db.orderAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    throw new NotFoundError(ERROR_CODES.PRO_ASSIGNMENT_NOT_FOUND, 'Assignment not found');
  }

  if (assignment.professionalId !== proId) {
    throw new ForbiddenError(ERROR_CODES.PRO_NOT_ASSIGNED, 'Not your assignment');
  }

  if (assignment.status !== 'assigned') {
    throw new ConflictError(ERROR_CODES.PRO_ASSIGNMENT_WRONG_STATUS, 'Assignment cannot be declined');
  }

  return deps.db.orderAssignment.update({
    where: { id: assignment.id },
    data: { status: 'declined', confirmedAt: null },
  });
}
