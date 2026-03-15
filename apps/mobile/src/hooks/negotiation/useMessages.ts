import { useMemo } from 'react';
import { trpc } from '../../lib/trpc';

export function useMessages(orderId: string, limit = 30) {
  const query = trpc.negotiation.messages.useInfiniteQuery(
    { orderId, limit },
    {
      enabled: Boolean(orderId),
      refetchOnMount: true,
      getNextPageParam(lastPage) {
        if (!lastPage || lastPage.length === 0) {
          return undefined;
        }

        return lastPage[0]?.seq;
      },
    },
  );

  const messages = useMemo(() => {
    const pages = query.data?.pages ?? [];
    return pages.flatMap((page) => page).sort((a, b) => a.seq - b.seq);
  }, [query.data?.pages]);

  return {
    ...query,
    messages,
  };
}
