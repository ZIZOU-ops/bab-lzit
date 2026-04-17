import {
  computePrice,
  getDemandMultiplier,
  getLocationMultiplier,
} from '@babloo/shared/pricing';
import type { PricingParams } from '@babloo/shared/pricing';
import type { ServiceType } from '@prisma/client';

export type PricingEstimateResult = {
  floorPrice: number;
  recommendedPrice: number;
  ceilingPrice: number;
  durationMinutes: { min: number; max: number };
};

export function estimatePrice(
  serviceType: ServiceType,
  detail: PricingParams,
): PricingEstimateResult {
  const result = computePrice(serviceType, detail);
  const locationMult = detail.neighborhoodId ? getLocationMultiplier(detail.neighborhoodId) : 1.0;
  const demandMult = getDemandMultiplier(detail.demandLevel);
  const recommendedPrice = Math.round(
    Math.max(result.floorPrice, result.floorPrice * locationMult * demandMult),
  );

  return {
    floorPrice: result.floorPrice,
    recommendedPrice,
    ceilingPrice: result.ceiling,
    durationMinutes: result.durationMinutes,
  };
}
