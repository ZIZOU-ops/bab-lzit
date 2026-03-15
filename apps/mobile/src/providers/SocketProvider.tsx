import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import { createSocket, type AppSocket } from '../lib/socket';
import { useAuth } from './AuthProvider';

type SocketContextValue = {
  socket: AppSocket | null;
  isConnected: boolean;
  joinOrder: (orderId: string) => void;
  leaveOrder: (orderId: string) => void;
};

const SocketContext = createContext<SocketContextValue | null>(null);
const isExpoGo =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, state } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<AppSocket | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const roomsRef = useRef<Set<string>>(new Set());
  const connectedRef = useRef(false);

  const updateConnected = useCallback((next: boolean) => {
    if (connectedRef.current === next) {
      return;
    }
    connectedRef.current = next;
    setIsConnected(next);
  }, []);

  const cleanupSocket = useCallback(() => {
    if (!socketRef.current) {
      return;
    }

    socketRef.current.removeAllListeners();
    socketRef.current.disconnect();
    socketRef.current = null;
    setSocket(null);
    updateConnected(false);
  }, [updateConnected]);

  useEffect(() => {
    if (isExpoGo) {
      cleanupSocket();
      return;
    }

    if (state !== 'authenticated' || !token) {
      cleanupSocket();
      return;
    }

    const socket = createSocket(token);
    socketRef.current = socket;
    setSocket(socket);

    socket.on('connect', () => {
      updateConnected(true);
      roomsRef.current.forEach((orderId) => {
        socket.emit('room:join', { orderId });
      });
    });

    socket.on('disconnect', () => {
      updateConnected(false);
    });

    socket.connect();

    return () => {
      cleanupSocket();
    };
  }, [cleanupSocket, state, token, updateConnected]);

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    if (state !== 'authenticated' || !token || !socketRef.current) {
      return;
    }

    socketRef.current.emit('auth:renew', { token });
  }, [state, token]);

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

    const subscription = AppState.addEventListener('change', (appState) => {
      const socket = socketRef.current;
      if (!socket) {
        return;
      }

      if (appState === 'active') {
        if (!socket.connected) {
          socket.connect();
        }
      } else if (appState === 'background' || appState === 'inactive') {
        if (socket.connected) {
          socket.disconnect();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const joinOrder = useCallback((orderId: string) => {
    roomsRef.current.add(orderId);
    if (isExpoGo) {
      return;
    }
    socketRef.current?.emit('room:join', { orderId });
  }, []);

  const leaveOrder = useCallback((orderId: string) => {
    roomsRef.current.delete(orderId);
    if (isExpoGo) {
      return;
    }
    socketRef.current?.emit('room:leave', { orderId });
  }, []);

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      isConnected,
      joinOrder,
      leaveOrder,
    }),
    [socket, isConnected, joinOrder, leaveOrder],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }

  return context;
}
