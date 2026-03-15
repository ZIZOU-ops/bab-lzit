import { createAdapter } from '@socket.io/redis-adapter';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import { Server } from 'socket.io';
import {
  authRenewPayload,
  roomJoinPayload,
  roomLeavePayload,
} from '@babloo/shared';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@babloo/shared/types';
import { AppError } from '../lib/errors';
import * as negotiationService from '../services/negotiation.service';
import {
  authenticateSocket,
  renewSocketAuth,
  type AuthenticatedSocket,
} from './auth';
import { registerMessageHandlers } from './handlers/message.handler';
import { registerOfferHandlers } from './handlers/offer.handler';
import { registerTypingHandlers } from './handlers/typing.handler';

export function attachSocketServer(input: {
  app: any;
  db: PrismaClient;
  redis: Redis;
  corsOrigins: string[];
  logger: Logger;
}) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(input.app.server, {
    cors: {
      origin: input.corsOrigins,
      credentials: true,
    },
  });

  const pubClient = input.redis.duplicate();
  const subClient = input.redis.duplicate();

  io.adapter(createAdapter(pubClient, subClient));

  io.use((socket, next) => authenticateSocket(socket as AuthenticatedSocket, next));

  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const emitSocketError = (code: string, message: string) => {
      authSocket.emit('error', { code, message });
    };

    socket.on('room:join', async (payload) => {
      const parsed = roomJoinPayload.safeParse(payload);
      if (!parsed.success) {
        emitSocketError('GEN_900', 'Invalid room:join payload');
        return;
      }

      const user = authSocket.data.user;
      if (!user) {
        emitSocketError('AUTH_005', 'Unauthorized');
        return;
      }

      try {
        await negotiationService.checkParticipant(
          { db: input.db, logger: input.logger },
          user.id,
          parsed.data.orderId,
        );
        await authSocket.join(parsed.data.orderId);
      } catch (error) {
        if (error instanceof AppError) {
          emitSocketError(error.code, error.message);
          return;
        }
        input.logger.error(
          { error, event: 'room:join', orderId: parsed.data.orderId, socketId: authSocket.id },
          'Socket room:join failed',
        );
        emitSocketError('GEN_999', 'Unable to join room');
      }
    });

    socket.on('room:leave', async (payload) => {
      const parsed = roomLeavePayload.safeParse(payload);
      if (!parsed.success) {
        emitSocketError('GEN_900', 'Invalid room:leave payload');
        return;
      }

      await authSocket.leave(parsed.data.orderId);
    });

    socket.on('auth:renew', (payload) => {
      const parsed = authRenewPayload.safeParse(payload);
      if (!parsed.success) {
        emitSocketError('GEN_900', 'Invalid auth:renew payload');
        return;
      }

      try {
        renewSocketAuth(authSocket, parsed.data.token);
      } catch {
        emitSocketError('AUTH_005', 'Unauthorized');
      }
    });

    registerMessageHandlers({
      io,
      socket: authSocket,
      db: input.db,
      redis: input.redis,
      logger: input.logger,
    });

    registerOfferHandlers({
      io,
      socket: authSocket,
      db: input.db,
      redis: input.redis,
      logger: input.logger,
    });

    registerTypingHandlers({
      io,
      socket: authSocket,
      logger: input.logger,
    });
  });

  input.logger.info('Socket.IO Redis adapter enabled');

  return io;
}
