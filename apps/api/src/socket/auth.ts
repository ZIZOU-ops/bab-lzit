import type { Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';

export type AuthenticatedSocket = Socket & {
  data: {
    user?: {
      id: string;
      role: string;
      locale: string;
      fullName: string;
    };
  };
};

function userFromToken(token: string) {
  const payload = verifyAccessToken(token);
  return {
    id: payload.userId,
    role: payload.role,
    locale: payload.locale,
    fullName: payload.fullName,
  };
}

export function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (error?: Error) => void,
) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    next(new Error('Unauthorized: missing token'));
    return;
  }

  try {
    socket.data.user = userFromToken(token);
    next();
  } catch {
    next(new Error('Unauthorized: invalid token'));
  }
}

export function renewSocketAuth(socket: AuthenticatedSocket, token: string) {
  socket.data.user = userFromToken(token);
}
