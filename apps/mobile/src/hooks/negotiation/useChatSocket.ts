import { useEffect, useMemo, useRef, useState } from 'react';
import type { OfferStatus, OrderStatus } from '@babloo/shared';
import { trpc } from '../../lib/trpc';
import { useSocket } from '../../providers/SocketProvider';

export function useChatSocket(orderId: string) {
  const { socket, isConnected, joinOrder, leaveOrder } = useSocket();
  const utils = trpc.useUtils();
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!orderId) {
      return;
    }

    joinOrder(orderId);
    return () => {
      leaveOrder(orderId);
    };
  }, [joinOrder, leaveOrder, orderId]);

  useEffect(() => {
    if (!socket || !orderId) {
      return;
    }

    const onMessageNew = (payload: {
      id: string;
      orderId: string;
      senderId: string;
      senderName: string;
      content: string;
      seq: number;
      clientMessageId: string | null;
      createdAt: string;
    }) => {
      if (payload.orderId !== orderId) {
        return;
      }

      void utils.negotiation.messages.invalidate({ orderId, limit: 30 });
    };

    const onOfferNew = (payload: {
      id: string;
      orderId: string;
      senderId: string;
      senderName: string;
      amount: number;
      status: OfferStatus;
      seq: number;
      createdAt: string;
      acceptedAt: string | null;
    }) => {
      if (payload.orderId !== orderId) {
        return;
      }

      void utils.negotiation.offers.invalidate({ orderId });
      void utils.order.byId.invalidate({ orderId });
    };

    const onOfferAccepted = (payload: {
      orderId: string;
      offerId: string;
      finalPrice: number;
    }) => {
      if (payload.orderId !== orderId) {
        return;
      }

      void utils.negotiation.offers.invalidate({ orderId });
      void utils.order.byId.invalidate({ orderId });
      void utils.order.list.invalidate();
    };

    const onStatusUpdate = (payload: {
      orderId: string;
      status: OrderStatus;
      updatedAt: string;
    }) => {
      if (payload.orderId !== orderId) {
        return;
      }

      utils.order.byId.setData({ orderId }, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          status: payload.status,
        };
      });

      void utils.order.list.invalidate();
    };

    const onTyping = (payload: {
      orderId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    }) => {
      if (payload.orderId !== orderId) {
        return;
      }

      setTypingUsers((current) => {
        const next = { ...current };
        if (payload.isTyping) {
          next[payload.userId] = payload.userName;
        } else {
          delete next[payload.userId];
        }
        return next;
      });

      const existingTimer = typingTimeoutsRef.current.get(payload.userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      if (payload.isTyping) {
        const timer = setTimeout(() => {
          setTypingUsers((current) => {
            const next = { ...current };
            delete next[payload.userId];
            return next;
          });
          typingTimeoutsRef.current.delete(payload.userId);
        }, 500);

        typingTimeoutsRef.current.set(payload.userId, timer);
      }
    };

    socket.on('message:new', onMessageNew);
    socket.on('offer:new', onOfferNew);
    socket.on('offer:accepted', onOfferAccepted);
    socket.on('status:update', onStatusUpdate);
    socket.on('typing:indicator', onTyping);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('offer:new', onOfferNew);
      socket.off('offer:accepted', onOfferAccepted);
      socket.off('status:update', onStatusUpdate);
      socket.off('typing:indicator', onTyping);
      typingTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
      typingTimeoutsRef.current.clear();
      setTypingUsers({});
    };
  }, [orderId, socket, utils]);

  return useMemo(
    () => ({
      isConnected,
      socket,
      typingUsers: Object.values(typingUsers),
    }),
    [isConnected, socket, typingUsers],
  );
}
