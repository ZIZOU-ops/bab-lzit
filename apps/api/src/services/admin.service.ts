import { ERROR_CODES } from '@babloo/shared/errors';
import type { DemandLevel, TimeSlotKey } from '@babloo/shared/pricing';
import type { OrderStatus, PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { NotFoundError } from '../lib/errors';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function* eachDate(startDate: string, endDate: string) {
  const current = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  while (current <= end) {
    yield new Date(current);
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

export async function overrideOrderStatus(
  deps: Deps,
  adminUserId: string,
  orderId: string,
  toStatus: OrderStatus,
  reason?: string,
) {
  const order = await deps.db.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
  }

  return deps.db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus },
      include: { detail: true },
    });

    const latestStatus = await tx.statusEvent.findFirst({
      where: { orderId },
      orderBy: { seq: 'desc' },
      select: { seq: true },
    });

    await tx.statusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        actorUserId: adminUserId,
        actorRole: 'admin',
        reason: reason ?? null,
        seq: (latestStatus?.seq ?? 0) + 1,
      },
    });

    await tx.auditLog.create({
      data: {
        action: 'order.status.override',
        entityType: 'Order',
        entityId: orderId,
        actorUserId: adminUserId,
        actorRole: 'admin',
        metadata: { fromStatus: order.status, toStatus, reason },
      },
    });

    return updated;
  });
}

export async function overrideOrderPrice(
  deps: Deps,
  adminUserId: string,
  orderId: string,
  finalPrice: number,
  reason?: string,
) {
  const order = await deps.db.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new NotFoundError(ERROR_CODES.ORDER_NOT_FOUND, 'Order not found');
  }

  return deps.db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { finalPrice },
      include: { detail: true },
    });

    await tx.auditLog.create({
      data: {
        action: 'order.price.override',
        entityType: 'Order',
        entityId: orderId,
        actorUserId: adminUserId,
        actorRole: 'admin',
        metadata: { previousPrice: order.finalPrice, newPrice: finalPrice, reason },
      },
    });

    return updated;
  });
}

export async function toggleUserActive(
  deps: Deps,
  adminUserId: string,
  targetUserId: string,
  isActive: boolean,
) {
  const user = await deps.db.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new NotFoundError(ERROR_CODES.ADMIN_USER_NOT_FOUND, 'User not found');
  }

  return deps.db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: isActive ? 'user.activate' : 'user.suspend',
        entityType: 'User',
        entityId: targetUserId,
        actorUserId: adminUserId,
        actorRole: 'admin',
        metadata: {
          previousIsActive: user.isActive,
          newIsActive: isActive,
        },
      },
    });

    return updated;
  });
}

export async function getAuditLog(
  deps: Deps,
  cursor?: string,
  limit = 50,
) {
  const take = Math.min(Math.max(limit, 1), 100) + 1;

  const logs = await deps.db.auditLog.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  const hasMore = logs.length > take - 1;
  const data = hasMore ? logs.slice(0, take - 1) : logs;
  const nextCursor = hasMore ? data[data.length - 1]?.id ?? null : null;

  return {
    items: data,
    nextCursor,
  };
}

export async function setDemandSlots(
  deps: Deps,
  input: {
    date: string;
    slots: Array<{ timeSlot: TimeSlotKey; level: DemandLevel }>;
  },
) {
  const date = parseDateOnly(input.date);

  await deps.db.$transaction(
    input.slots.map((slot) =>
      deps.db.demandSlot.upsert({
        where: { date_timeSlot: { date, timeSlot: slot.timeSlot } },
        create: {
          date,
          timeSlot: slot.timeSlot,
          level: slot.level,
        },
        update: { level: slot.level },
      }),
    ),
  );

  return { success: true };
}

export async function bulkSetDemand(
  deps: Deps,
  input: {
    startDate: string;
    endDate: string;
    level: DemandLevel;
    timeSlots?: TimeSlotKey[];
  },
) {
  const timeSlots = input.timeSlots ?? [
    'early_morning',
    'morning',
    'midday',
    'afternoon',
    'evening',
  ];

  const operations = [];
  for (const date of eachDate(input.startDate, input.endDate)) {
    for (const timeSlot of timeSlots) {
      operations.push(
        deps.db.demandSlot.upsert({
          where: { date_timeSlot: { date, timeSlot } },
          create: {
            date,
            timeSlot,
            level: input.level,
          },
          update: { level: input.level },
        }),
      );
    }
  }

  await deps.db.$transaction(operations);

  return { success: true };
}
