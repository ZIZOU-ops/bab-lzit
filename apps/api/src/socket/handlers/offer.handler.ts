import { offerAcceptPayload, offerCreatePayload } from '@babloo/shared';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import type { Server } from 'socket.io';
import { checkSocketRateLimit } from '../rate-limit';
import type { AuthenticatedSocket } from '../auth';
import * as negotiationService from '../../services/negotiation.service';

export function registerOfferHandlers(input: {
  io: Server;
  socket: AuthenticatedSocket;
  db: PrismaClient;
  redis: Redis;
  logger: Logger;
}) {
  input.socket.on('offer:create', async (payload) => {
    const parsed = offerCreatePayload.safeParse(payload);

    if (!parsed.success) {
      input.socket.emit('error', {
        code: 'GEN_900',
        message: 'Invalid offer:create payload',
      });
      return;
    }

    const user = input.socket.data.user;
    if (!user) {
      input.socket.emit('error', {
        code: 'AUTH_005',
        message: 'Unauthorized',
      });
      return;
    }

    const allowed = await checkSocketRateLimit({
      redis: input.redis,
      userId: user.id,
      eventName: 'offer:create',
      limit: 5,
      windowSeconds: 60,
    });

    if (!allowed) {
      input.socket.emit('error', {
        code: 'GEN_902',
        message: 'Rate limit exceeded for offers',
      });
      return;
    }

    try {
      const offer = await negotiationService.createOffer(
        { db: input.db, logger: input.logger },
        {
          orderId: parsed.data.orderId,
          userId: user.id,
          amount: parsed.data.amount,
        },
      );

      input.io.to(parsed.data.orderId).emit('offer:new', {
        id: offer.id,
        orderId: offer.orderId,
        senderId: user.id,
        senderName: user.fullName,
        amount: offer.amount,
        status: offer.status,
        seq: offer.seq,
        createdAt: offer.createdAt.toISOString(),
        acceptedAt: offer.acceptedAt?.toISOString() ?? null,
      });
    } catch (error) {
      input.logger.error(
        {
          correlationId: input.socket.id,
          event: 'offer:create',
          error,
          orderId: parsed.data.orderId,
        },
        'Socket offer:create failed',
      );
      input.socket.emit('error', {
        code: 'GEN_999',
        message: 'Unable to create offer',
      });
    }
  });

  input.socket.on('offer:accept', async (payload) => {
    const parsed = offerAcceptPayload.safeParse(payload);

    if (!parsed.success) {
      input.socket.emit('error', {
        code: 'GEN_900',
        message: 'Invalid offer:accept payload',
      });
      return;
    }

    const user = input.socket.data.user;
    if (!user) {
      input.socket.emit('error', {
        code: 'AUTH_005',
        message: 'Unauthorized',
      });
      return;
    }

    try {
      const accepted = await negotiationService.acceptOffer(
        { db: input.db, logger: input.logger },
        {
          orderId: parsed.data.orderId,
          offerId: parsed.data.offerId,
          userId: user.id,
        },
      );

      input.io.to(parsed.data.orderId).emit('offer:accepted', {
        orderId: parsed.data.orderId,
        offerId: parsed.data.offerId,
        finalPrice: accepted.finalPrice,
      });
    } catch (error) {
      input.logger.error(
        {
          correlationId: input.socket.id,
          event: 'offer:accept',
          error,
          orderId: parsed.data.orderId,
        },
        'Socket offer:accept failed',
      );

      input.socket.emit('error', {
        code: 'GEN_999',
        message: 'Unable to accept offer',
      });
    }
  });
}
