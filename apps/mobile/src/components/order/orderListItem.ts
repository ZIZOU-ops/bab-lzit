export type ClientOrderItem = {
  id: string;
  serviceType: string;
  status: string;
  floorPrice: number;
  finalPrice?: number | null;
  createdAt: string | Date;
  location?: string;
  detail?: {
    cleanType?: string | null;
    teamType?: string | null;
  } | null;
};

export type CleaningOrderMode = 'standard' | 'express' | 'recurrent';

function isOrderDetail(
  value: unknown,
): value is NonNullable<ClientOrderItem['detail']> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.cleanType == null || typeof candidate.cleanType === 'string'
  ) && (
    candidate.teamType == null || typeof candidate.teamType === 'string'
  );
}

export function isClientOrderItem(item: unknown): item is ClientOrderItem {
  if (!item || typeof item !== 'object') {
    return false;
  }

  const candidate = item as Partial<ClientOrderItem>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.serviceType === 'string' &&
    typeof candidate.status === 'string' &&
    typeof candidate.floorPrice === 'number' &&
    (typeof candidate.createdAt === 'string' || candidate.createdAt instanceof Date) &&
    (candidate.detail == null || isOrderDetail(candidate.detail))
  );
}

export function isMenageOrder(order: ClientOrderItem) {
  return order.serviceType === 'menage';
}

export function getCleaningOrderMode(order: ClientOrderItem): CleaningOrderMode {
  // Booking mode is not persisted yet, so the icon falls back to the strongest signal we have.
  const teamType = order.detail?.teamType;

  if (order.status === 'completed') {
    return 'recurrent';
  }

  if (teamType === 'duo' || teamType === 'squad') {
    return 'express';
  }

  return 'standard';
}
