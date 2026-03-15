import { useMemo } from 'react';
import { trpc } from '../../lib/trpc';
import { getPageItems } from '../../lib/pagination';

type ProOrderItem = {
  id: string;
  assignmentId: string;
  assignmentStatus: string;
  serviceType: string;
  status: string;
  floorPrice: number;
  finalPrice?: number | null;
  createdAt: string | Date;
  location?: string;
};

function isProOrderItem(item: unknown): item is ProOrderItem {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const candidate = item as Partial<ProOrderItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.assignmentId === 'string' &&
    typeof candidate.assignmentStatus === 'string' &&
    typeof candidate.serviceType === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.floorPrice === 'number' &&
    (typeof candidate.createdAt === 'string' || candidate.createdAt instanceof Date)
  );
}

export function useProProfile() {
  return trpc.pro.profile.useQuery();
}

export function useProOrders(limit = 20) {
  const query = trpc.pro.orders.useInfiniteQuery(
    { limit },
    {
      getNextPageParam(lastPage) {
        return lastPage.nextCursor ?? undefined;
      },
    },
  );

  const orders = useMemo(
    () =>
      query.data?.pages?.flatMap((page) =>
        getPageItems(page).filter(isProOrderItem),
      ) ?? [],
    [query.data?.pages],
  );

  return {
    ...query,
    orders,
  };
}

export function useProOpenSlots() {
  return trpc.pro.openSlots.useQuery();
}

export function useProJoinRequests(orderId: string, enabled = true) {
  return trpc.pro.joinRequests.useQuery(
    { orderId },
    {
      enabled: enabled && Boolean(orderId),
    },
  );
}
