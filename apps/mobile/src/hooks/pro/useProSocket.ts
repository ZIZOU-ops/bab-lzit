import { useEffect } from 'react';
import { trpc } from '../../lib/trpc';
import { useSocket } from '../../providers/SocketProvider';

export function useProSocket() {
  const { socket } = useSocket();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onStatusUpdate = () => {
      void Promise.all([
        utils.pro.orders.invalidate(),
        utils.order.byId.invalidate(),
        utils.order.list.invalidate(),
      ]);
    };

    socket.on('status:update', onStatusUpdate);

    return () => {
      socket.off('status:update', onStatusUpdate);
    };
  }, [socket, utils]);
}
