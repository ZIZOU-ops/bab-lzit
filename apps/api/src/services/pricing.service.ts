import { computePrice, NEGOTIATION_CEILING_MULTIPLIER } from '@babloo/shared/pricing';
import type { PricingParams } from '@babloo/shared/pricing';
import type { ServiceType } from '@prisma/client';

export function estimatePrice(serviceType: ServiceType, detail: PricingParams) {
  const result = computePrice(serviceType, detail);

  return {
    floorPrice: result.floorPrice,
    ceilingPrice: Math.round(result.floorPrice * NEGOTIATION_CEILING_MULTIPLIER),
    durationMinutes: result.durationMinutes,
  };
}
