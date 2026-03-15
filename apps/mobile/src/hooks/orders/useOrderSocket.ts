import { useEffect } from 'react';
import { trpc } from '../../lib/trpc';
import { useSocket } from '../../providers/SocketProvider';

export function useOrderSocket(orderId: string) {
  const { socket, joinOrder, leaveOrder } = useSocket();
  const utils = trpc.useUtils();

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

    const onStatusUpdate = (payload: {
      orderId: string;
      status: string;
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
          status: payload.status as typeof current.status,
        };
      });

      void utils.order.list.invalidate();
    };

    socket.on('status:update', onStatusUpdate);

    return () => {
      socket.off('status:update', onStatusUpdate);
    };
  }, [orderId, socket, utils]);
}
