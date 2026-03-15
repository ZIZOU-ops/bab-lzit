import { trpc } from '../../lib/trpc';

export function useOffers(orderId: string) {
  return trpc.negotiation.offers.useQuery(
    { orderId },
    {
      enabled: Boolean(orderId),
      refetchOnMount: true,
    },
  );
}
