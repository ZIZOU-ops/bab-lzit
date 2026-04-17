import { randomUUID } from 'node:crypto';
import {
  canTransition,
  computePrice,
  getDemandMultiplier,
  type PricingParams,
} from '@babloo/shared';
import { ERROR_CODES } from '@babloo/shared/errors';
import type {
  ActorRole,
  CleanType,
  OrderStatus,
  PrismaClient,
  ServiceType,
  TeamType,
} from '@prisma/client';
import type { Logger } from 'pino';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../lib/errors';
import type { DbClient } from '../lib/prisma';
import { matchPro } from './matching.service';
import * as notificationService from './notification.service';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

type CreateOrderInput = {
  serviceType: ServiceType;
  location: string;
  neighborhoodId?: string;
  scheduledDate?: string;
  scheduledTimeSlot?: string;
  demandLevel?: string;
  scheduledStartAt?: string;
  detail: Record<string, unknown>;
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

type ListOrdersInput = {
  userId: string;
  cursor?: string;
  limit: number;
};

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString(
    'base64url',
  );
}

function decodeCursor(cursor: string) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      createdAt: string;
      id: string;
    };

    return {
      createdAt: new Date(decoded.createdAt),
      id: decoded.id,
    };
  } catch {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Invalid cursor');
  }
}

function extractPricingParams(
  serviceType: ServiceType,
  detail: Record<string, unknown>,
): PricingParams {
  switch (serviceType) {
    case 'menage':
      return {
        surface: detail.surface as number,
        cleanType: detail.cleanType as string,
        teamType: detail.teamType as string,
        propertyType: detail.propertyType as string | undefined,
        floors: detail.floors as number | undefined,
        squadSize: detail.squadSize as number | undefined,
      } as PricingParams;
    case 'cuisine':
      return {
        guests: detail.guests as number,
        mealType: detail.mealType as string | undefined,
      } as PricingParams;
    case 'childcare':
      return {
        children: detail.children as number,
        hours: detail.hours as number,
      } as PricingParams;
    default:
      throw new ValidationError(
        ERROR_CODES.ORDER_INVALID_SERVICE_DETAILS,
        `Unknown service type: ${serviceType}`,
      );
  }
}

function buildDetailData(serviceType: ServiceType, detail: Record<string, unknown>) {
  switch (serviceType) {
    case 'menage':
      return {
        surface: detail.surface as number,
        cleanType: detail.cleanType as CleanType,
        teamType: detail.teamType as TeamType,
        propertyType: (detail.propertyType as string | undefined) ?? null,
        floors: (detail.floors as number | undefined) ?? null,
        squadSize: (detail.squadSize as number | undefined) ?? null,
        notes: (detail.notes as string | undefined) ?? null,
      };
    case 'cuisine':
      return {
        guests: detail.guests as number,
        mealType: (detail.mealType as string | undefined) ?? null,
        dishes: (detail.dishes as string | undefined) ?? null,
      };
    case 'childcare':
      return {
        children: detail.children as number,
        hours: detail.hours as number,
        notes: (detail.notes as string | undefined) ?? null,
      };
    default:
      throw new ValidationError(
        ERROR_CODES.ORDER_INVALID_SERVICE_DETAILS,
        `Unknown service type: ${serviceType}`,
      );
  }
}

async function nextStatusSeq(tx: DbClient, orderId: string) {
  const latest = await tx.statusEvent.findFirst({
    where: { orderId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });

  return (latest?.seq ?? 0) + 1;
}

async function createStatusEvent(
  tx: DbClient,
  params: {
    orderId: string;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    actorUserId: string;
    actorRole: ActorRole;
    reason?: string | null;
  },
) {
  const seq = await nextStatusSeq(tx, params.orderId);
  return tx.statusEvent.create({
    data: {
      ...params,
      seq,
      reason: params.reason ?? null,
    },
  });
}

async function getParticipantRole(deps: Deps, userId: string, orderId: string) {
  const order = await deps.db.order.findUnique({
    where: { id: orderId },
    include: {
      assignments: {
        include: {
          professional: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
  }

  if (order.clientId === userId) {
    return { order, role: 'client' as const };
  }

  const assignment = order.assignments.find((a) => a.professional.userId === userId);
  if (assignment) {
    return { order, role: 'pro' as const };
  }

  throw new ForbiddenError(ERROR_CODES.ORDER_NOT_OWNED, 'Order not owned by user');
}

export async function create(deps: Deps, userId: string, input: CreateOrderInput) {
  const pricingParams = extractPricingParams(input.serviceType, input.detail);
  const pricing = computePrice(input.serviceType, pricingParams);

  let matchedProUserId: string | null = null;

  const order = await deps.db.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        clientId: userId,
        serviceType: input.serviceType,
        status: 'draft',
        floorPrice: pricing.floorPrice,
        location: input.location,
        neighborhoodId: input.neighborhoodId ?? null,
        scheduledDate: input.scheduledDate ? parseDateOnly(input.scheduledDate) : null,
        scheduledTimeSlot: input.scheduledTimeSlot ?? null,
        demandLevel: input.demandLevel ?? null,
        demandMultiplier: input.demandLevel
          ? getDemandMultiplier(input.demandLevel as 'green' | 'yellow' | 'red')
          : null,
        scheduledStartAt: input.scheduledStartAt ? new Date(input.scheduledStartAt) : null,
      },
    });

    await tx.orderDetail.create({
      data: {
        orderId: newOrder.id,
        ...buildDetailData(input.serviceType, input.detail),
      },
    });

    await createStatusEvent(tx, {
      orderId: newOrder.id,
      fromStatus: 'draft',
      toStatus: 'draft',
      actorUserId: userId,
      actorRole: 'client',
    });

    await tx.order.update({
      where: { id: newOrder.id },
      data: { status: 'submitted' },
    });

    await createStatusEvent(tx, {
      orderId: newOrder.id,
      fromStatus: 'draft',
      toStatus: 'submitted',
      actorUserId: userId,
      actorRole: 'client',
    });

    const selectedPro = await matchPro(
      { db: deps.db, logger: deps.logger },
      {
        serviceType: newOrder.serviceType,
        location: newOrder.location,
        detail: {
          teamType: (input.detail.teamType as string | undefined) ?? null,
        },
      },
      tx,
    );

    if (selectedPro) {
      matchedProUserId = selectedPro.userId;

      await tx.order.update({
        where: { id: newOrder.id },
        data: { status: 'searching' },
      });

      await createStatusEvent(tx, {
        orderId: newOrder.id,
        fromStatus: 'submitted',
        toStatus: 'searching',
        actorUserId: userId,
        actorRole: 'client',
      });

      await tx.orderAssignment.create({
        data: {
          orderId: newOrder.id,
          professionalId: selectedPro.id,
          isLead: true,
          status: 'assigned',
        },
      });

      await tx.order.update({
        where: { id: newOrder.id },
        data: { status: 'negotiating' },
      });

      await createStatusEvent(tx, {
        orderId: newOrder.id,
        fromStatus: 'searching',
        toStatus: 'negotiating',
        actorUserId: userId,
        actorRole: 'client',
      });
    }

    return tx.order.findUniqueOrThrow({
      where: { id: newOrder.id },
      include: {
        detail: true,
        statusEvents: { orderBy: { seq: 'asc' } },
        rating: true,
        assignments: {
          include: {
            professional: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  });

  if (matchedProUserId) {
    deps.logger.info({ orderId: order.id, matchedProUserId }, 'Order matched to pro');
    await notificationService.notifyNewOffer(
      { db: deps.db, logger: deps.logger },
      {
        orderId: order.id,
        proUserId: matchedProUserId,
        correlationId: randomUUID(),
      },
    );

    if (order.scheduledStartAt) {
      await notificationService.scheduleServiceReminder(
        { db: deps.db, logger: deps.logger },
        {
          orderId: order.id,
          proUserId: matchedProUserId,
          scheduledStartAt: order.scheduledStartAt,
          correlationId: randomUUID(),
        },
      );
    }
  }

  return {
    ...order,
    pricing: {
      floorPrice: pricing.floorPrice,
      ceiling: pricing.ceiling,
      durationMinutes: pricing.durationMinutes,
    },
  };
}

export async function list(deps: Deps, input: ListOrdersInput) {
  const limit = Math.min(Math.max(input.limit, 1), 50);
  const where = input.cursor
    ? (() => {
        const cursor = decodeCursor(input.cursor);
        return {
          clientId: input.userId,
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            {
              createdAt: cursor.createdAt,
              id: { lt: cursor.id },
            },
          ],
        };
      })()
    : { clientId: input.userId };

  const rows = await deps.db.order.findMany({
    where,
    take: limit + 1,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: { detail: true },
  });

  const hasNext = rows.length > limit;
  const items = hasNext ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1] ?? null;

  return {
    items,
    nextCursor: last ? encodeCursor(last.createdAt, last.id) : null,
  };
}

export async function getById(deps: Deps, userId: string, orderId: string) {
  await getParticipantRole(deps, userId, orderId);

  return deps.db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      detail: true,
      statusEvents: { orderBy: { seq: 'asc' } },
      rating: true,
      assignments: {
        include: {
          professional: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
}

export async function cancel(
  deps: Deps,
  userId: string,
  orderId: string,
  reason?: string,
) {
  const order = await deps.db.order.findUnique({ where: { id: orderId } });

  if (!order || order.clientId !== userId) {
    throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
  }

  if (!canTransition(order.status, 'cancelled')) {
    throw new ConflictError(ERROR_CODES.ORDER_INVALID_TRANSITION, 'Invalid order transition');
  }

  return deps.db.$transaction(async (tx) => {
    const cancelled = await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
      include: { detail: true },
    });

    await createStatusEvent(tx, {
      orderId,
      fromStatus: order.status,
      toStatus: 'cancelled',
      actorUserId: userId,
      actorRole: 'client',
      reason,
    });

    return cancelled;
  });
}

export async function updateStatus(
  deps: Deps,
  userId: string,
  orderId: string,
  toStatus: OrderStatus,
  reason?: string,
) {
  const { order, role } = await getParticipantRole(deps, userId, orderId);

  if (role !== 'pro') {
    throw new ForbiddenError(ERROR_CODES.AUTH_FORBIDDEN, 'Only pro can update status');
  }

  if (!canTransition(order.status, toStatus)) {
    throw new ConflictError(ERROR_CODES.ORDER_INVALID_TRANSITION, 'Invalid order transition');
  }

  const updatedOrder = await deps.db.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus },
      include: { detail: true },
    });

    await createStatusEvent(tx, {
      orderId,
      fromStatus: order.status,
      toStatus,
      actorUserId: userId,
      actorRole: 'pro',
      reason,
    });

    return updatedOrder;
  });

  await notificationService.notifyStatusChange(
    { db: deps.db, logger: deps.logger },
    {
      orderId,
      toStatus,
      correlationId: randomUUID(),
    },
  );

  return updatedOrder;
}

export async function rate(
  deps: Deps,
  userId: string,
  orderId: string,
  stars: number,
  comment?: string,
) {
  const order = await deps.db.order.findUnique({
    where: { id: orderId },
    include: {
      rating: true,
      assignments: true,
    },
  });

  if (!order || order.clientId !== userId) {
    throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
  }

  if (order.status !== 'completed') {
    throw new ConflictError(ERROR_CODES.ORDER_NOT_COMPLETED, 'Order is not completed');
  }

  if (order.rating) {
    throw new ConflictError(ERROR_CODES.ORDER_ALREADY_RATED, 'Order already rated');
  }

  return deps.db.$transaction(async (tx) => {
    const rating = await tx.rating.create({
      data: {
        orderId,
        clientId: userId,
        stars,
        comment: comment?.trim() || null,
      },
    });

    for (const assignment of order.assignments) {
      const professional = await tx.professional.findUnique({
        where: { id: assignment.professionalId },
      });

      if (!professional) {
        continue;
      }

      const newTotal = professional.totalSessions + 1;
      const newRating =
        (professional.rating * professional.totalSessions + stars) / newTotal;

      await tx.professional.update({
        where: { id: professional.id },
        data: {
          rating: Math.round(newRating * 100) / 100,
          totalSessions: newTotal,
        },
      });
    }

    return rating;
  });
}
