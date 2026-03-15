import { messageSendPayload } from '@babloo/shared';
import type { Server } from 'socket.io';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import { checkSocketRateLimit } from '../rate-limit';
import type { AuthenticatedSocket } from '../auth';
import * as negotiationService from '../../services/negotiation.service';

export function registerMessageHandlers(input: {
  io: Server;
  socket: AuthenticatedSocket;
  db: PrismaClient;
  redis: Redis;
  logger: Logger;
}) {
  input.socket.on('message:send', async (payload) => {
    const parsed = messageSendPayload.safeParse(payload);
    if (!parsed.success) {
      input.socket.emit('error', {
        code: 'GEN_900',
        message: 'Invalid message payload',
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
      eventName: 'message:send',
      limit: 30,
      windowSeconds: 60,
    });

    if (!allowed) {
      input.socket.emit('error', {
        code: 'GEN_902',
        message: 'Rate limit exceeded for messages',
      });
      return;
    }

    try {
      const message = await negotiationService.sendMessage(
        { db: input.db, logger: input.logger },
        {
          orderId: parsed.data.orderId,
          userId: user.id,
          content: parsed.data.content,
          clientMessageId: parsed.data.clientMessageId,
        },
      );

      input.io.to(parsed.data.orderId).emit('message:new', {
        id: message.id,
        orderId: message.orderId,
        senderId: message.senderId,
        senderName: user.fullName,
        content: message.content,
        seq: message.seq,
        clientMessageId: message.clientMessageId,
        createdAt: message.createdAt.toISOString(),
      });
    } catch (error) {
      input.logger.error(
        {
          correlationId: input.socket.id,
          error,
          event: 'message:send',
          orderId: parsed.data.orderId,
        },
        'Socket message handler failed',
      );

      input.socket.emit('error', {
        code: 'GEN_999',
        message: 'Unable to send message',
      });
    }
  });
}
