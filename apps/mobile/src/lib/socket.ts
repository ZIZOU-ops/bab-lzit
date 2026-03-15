import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@babloo/shared';
import { SOCKET_URL } from '../constants/config';

export function createSocket(token: string) {
  return io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  }) as AppSocket;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
