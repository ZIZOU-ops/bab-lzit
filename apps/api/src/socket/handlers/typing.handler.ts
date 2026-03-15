import { typingStartPayload, typingStopPayload } from '@babloo/shared';
import type { Logger } from 'pino';
import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../auth';

export function registerTypingHandlers(input: {
  io: Server;
  socket: AuthenticatedSocket;
  logger: Logger;
}) {
  input.socket.on('typing:start', (payload) => {
    const parsed = typingStartPayload.safeParse(payload);
    if (!parsed.success) {
      input.socket.emit('error', {
        code: 'GEN_900',
        message: 'Invalid typing:start payload',
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

    input.socket.to(parsed.data.orderId).emit('typing:indicator', {
      orderId: parsed.data.orderId,
      userId: user.id,
      userName: user.fullName,
      isTyping: true,
    });
  });

  input.socket.on('typing:stop', (payload) => {
    const parsed = typingStopPayload.safeParse(payload);
    if (!parsed.success) {
      input.socket.emit('error', {
        code: 'GEN_900',
        message: 'Invalid typing:stop payload',
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

    input.socket.to(parsed.data.orderId).emit('typing:indicator', {
      orderId: parsed.data.orderId,
      userId: user.id,
      userName: user.fullName,
      isTyping: false,
    });
  });
}
