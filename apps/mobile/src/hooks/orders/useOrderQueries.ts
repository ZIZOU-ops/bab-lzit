import { trpc } from '../../lib/trpc';

export function useOrders(limit = 20) {
  return trpc.order.list.useInfiniteQuery(
    { limit },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor ?? undefined;
      },
    },
  );
}

export function useOrder(orderId: string) {
  return trpc.order.byId.useQuery(
    { orderId },
    {
      enabled: Boolean(orderId),
      refetchOnMount: true,
    },
  );
}
