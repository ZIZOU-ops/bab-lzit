import { randomUUID } from 'node:crypto';
import { ERROR_CODES } from '@babloo/shared/errors';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../lib/errors';
import type { DbClient } from '../lib/prisma';
import * as notificationService from './notification.service';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

const CEILING_MULTIPLIER = 2.5;
const OFFER_STEP = 5;

async function nextSeq(db: DbClient, orderId: string): Promise<number> {
  const latestMessage = await db.message.findFirst({
    where: { orderId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });

  const latestOffer = await db.negotiationOffer.findFirst({
    where: { orderId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });

  const latestStatus = await db.statusEvent.findFirst({
    where: { orderId },
    orderBy: { seq: 'desc' },
    select: { seq: true },
  });

  return Math.max(latestMessage?.seq ?? 0, latestOffer?.seq ?? 0, latestStatus?.seq ?? 0) + 1;
}

export async function checkParticipant(deps: Deps, userId: string, orderId: string) {
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
    return { order, participantRole: 'client' as const };
  }

  const assignment = order.assignments.find((a) => a.professional.userId === userId);
  if (assignment) {
    return { order, participantRole: 'pro' as const };
  }

  throw new ForbiddenError(ERROR_CODES.ORDER_NOT_OWNED, 'Not a participant');
}

export async function sendMessage(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
    content: string;
    clientMessageId?: string;
  },
) {
  const { order, participantRole } = await checkParticipant(deps, input.userId, input.orderId);

  if (order.status !== 'negotiating') {
    throw new ConflictError(
      ERROR_CODES.NEG_ORDER_NOT_NEGOTIATING,
      'Order is not in negotiating state',
    );
  }

  if (input.content.trim().length > 2000) {
    throw new ValidationError(ERROR_CODES.NEG_MESSAGE_TOO_LONG, 'Message too long');
  }

  if (input.clientMessageId) {
    const existing = await deps.db.message.findUnique({
      where: { clientMessageId: input.clientMessageId },
    });
    if (existing) {
      return existing;
    }
  }

  const message = await deps.db.$transaction(async (tx) => {
    const seq = await nextSeq(tx, input.orderId);

    return tx.message.create({
      data: {
        orderId: input.orderId,
        senderId: input.userId,
        senderRole: participantRole,
        content: input.content.trim(),
        clientMessageId: input.clientMessageId ?? null,
        seq,
      },
    });
  });

  await notificationService.notifyNewMessage(
    { db: deps.db, logger: deps.logger },
    {
      orderId: input.orderId,
      senderId: input.userId,
      content: message.content,
      correlationId: randomUUID(),
    },
  );

  return message;
}

export async function createOffer(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
    amount: number;
  },
) {
  const { order } = await checkParticipant(deps, input.userId, input.orderId);

  if (order.status !== 'negotiating') {
    throw new ConflictError(
      ERROR_CODES.NEG_ORDER_NOT_NEGOTIATING,
      'Order is not in negotiating state',
    );
  }

  const ceiling = Math.round(order.floorPrice * CEILING_MULTIPLIER);
  if (input.amount < order.floorPrice || input.amount > ceiling) {
    throw new ValidationError(
      ERROR_CODES.NEG_AMOUNT_OUT_OF_BOUNDS,
      `Offer amount must be between ${order.floorPrice} and ${ceiling}`,
    );
  }

  if (input.amount % OFFER_STEP !== 0) {
    throw new ValidationError(
      ERROR_CODES.NEG_AMOUNT_BAD_INCREMENT,
      `Offer amount must be a multiple of ${OFFER_STEP}`,
    );
  }

  return deps.db.$transaction(async (tx) => {
    await tx.negotiationOffer.updateMany({
      where: {
        orderId: input.orderId,
        offeredBy: input.userId,
        status: 'pending',
      },
      data: { status: 'rejected' },
    });

    const seq = await nextSeq(tx, input.orderId);

    return tx.negotiationOffer.create({
      data: {
        orderId: input.orderId,
        offeredBy: input.userId,
        amount: input.amount,
        status: 'pending',
        seq,
      },
    });
  });
}

export async function acceptOffer(
  deps: Deps,
  input: {
    orderId: string;
    offerId: string;
    userId: string;
  },
) {
  const { order, participantRole } = await checkParticipant(deps, input.userId, input.orderId);

  if (order.status !== 'negotiating') {
    throw new ConflictError(
      ERROR_CODES.NEG_ORDER_NOT_NEGOTIATING,
      'Order is not in negotiating state',
    );
  }

  const offer = await deps.db.negotiationOffer.findUnique({
    where: { id: input.offerId },
  });

  if (!offer || offer.orderId !== input.orderId) {
    throw new NotFoundError(ERROR_CODES.NEG_OFFER_NOT_FOUND, 'Offer not found');
  }

  if (offer.status !== 'pending') {
    throw new ConflictError(
      ERROR_CODES.NEG_OFFER_ALREADY_ACCEPTED,
      'Offer is not pending',
    );
  }

  if (offer.offeredBy === input.userId) {
    throw new ForbiddenError(ERROR_CODES.AUTH_FORBIDDEN, 'Cannot accept own offer');
  }

  const acceptedResult = await deps.db.$transaction(async (tx) => {
    const accepted = await tx.negotiationOffer.updateMany({
      where: {
        id: input.offerId,
        orderId: input.orderId,
        status: 'pending',
      },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    if (accepted.count === 0) {
      throw new ConflictError(
        ERROR_CODES.NEG_OFFER_ALREADY_ACCEPTED,
        'Offer already accepted or not pending',
      );
    }

    await tx.negotiationOffer.updateMany({
      where: {
        orderId: input.orderId,
        id: { not: input.offerId },
        status: 'pending',
      },
      data: { status: 'rejected' },
    });

    const acceptedOffer = await tx.negotiationOffer.findUniqueOrThrow({
      where: { id: input.offerId },
    });

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        finalPrice: acceptedOffer.amount,
        status: 'accepted',
      },
    });

    const statusSeq = await nextSeq(tx, input.orderId);

    await tx.statusEvent.create({
      data: {
        orderId: input.orderId,
        fromStatus: 'negotiating',
        toStatus: 'accepted',
        actorUserId: input.userId,
        actorRole: participantRole,
        seq: statusSeq,
      },
    });

    return {
      offer: acceptedOffer,
      finalPrice: acceptedOffer.amount,
    };
  });

  await notificationService.notifyStatusChange(
    { db: deps.db, logger: deps.logger },
    {
      orderId: input.orderId,
      toStatus: 'accepted',
      correlationId: randomUUID(),
    },
  );

  return acceptedResult;
}

export async function listMessages(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
    beforeSeq?: number;
    limit?: number;
  },
) {
  await checkParticipant(deps, input.userId, input.orderId);

  const limit = Math.min(Math.max(input.limit ?? 30, 1), 100);
  const rows = await deps.db.message.findMany({
    where: {
      orderId: input.orderId,
      ...(input.beforeSeq ? { seq: { lt: input.beforeSeq } } : {}),
    },
    orderBy: { seq: 'desc' },
    take: limit,
  });

  return rows.reverse();
}

export async function listOffers(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
  },
) {
  await checkParticipant(deps, input.userId, input.orderId);

  return deps.db.negotiationOffer.findMany({
    where: { orderId: input.orderId },
    orderBy: { seq: 'asc' },
  });
}

export async function poll(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
    afterSeq?: number;
  },
) {
  await checkParticipant(deps, input.userId, input.orderId);

  const after = input.afterSeq ?? 0;

  const [messages, offers, statusEvents] = await Promise.all([
    deps.db.message.findMany({
      where: { orderId: input.orderId, seq: { gt: after } },
      orderBy: { seq: 'asc' },
    }),
    deps.db.negotiationOffer.findMany({
      where: { orderId: input.orderId, seq: { gt: after } },
      orderBy: { seq: 'asc' },
    }),
    deps.db.statusEvent.findMany({
      where: { orderId: input.orderId, seq: { gt: after } },
      orderBy: { seq: 'asc' },
    }),
  ]);

  const lastSeq = Math.max(
    after,
    ...messages.map((message) => message.seq),
    ...offers.map((offer) => offer.seq),
    ...statusEvents.map((event) => event.seq),
  );

  return {
    messages,
    offers,
    statusEvents,
    lastSeq,
  };
}
