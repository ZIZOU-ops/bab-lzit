import type { TeamType } from '../types/enums';
import type { MenageParams, PriceResult, PropertyType } from './types';
import { NEGOTIATION_CEILING_MULTIPLIER, MIN_SQUAD_PAY_PER_EMPLOYEE_MAD } from './types';

const SURFACE_EXPONENT = 0.45;

const TEAM_COEFFICIENTS: Record<TeamType, number> = {
  solo: 17,
  duo: 23,
  squad: 32,
};

const LABOR_FLOOR_PER_WORKER = 120;
const PROPERTY_MULTIPLIERS: Record<PropertyType, number> = {
  apartment: 1.0,
  villa: 1.3,
  riad: 1.2,
  office: 0.9,
};
const FLOORS_MULTIPLIERS: Record<number, number> = {
  1: 1.0,
  2: 1.15,
  3: 1.25,
};
const SQUAD_EXTRA_MEMBER_SURCHARGE = 80;
const DEEP_PREMIUM = 0.8;

interface DurationRange {
  maxSurface: number;
  base: { min: number; max: number };
}

const DURATION_RANGES: DurationRange[] = [
  { maxSurface: 50, base: { min: 90, max: 150 } },
  { maxSurface: 90, base: { min: 150, max: 210 } },
  { maxSurface: 140, base: { min: 180, max: 270 } },
  { maxSurface: 200, base: { min: 240, max: 360 } },
  { maxSurface: Infinity, base: { min: 300, max: 420 } },
];

const TEAM_DURATION_MULTIPLIER = { solo: 1.0, duo: 0.65, squad: 0.5 } as const;

export function computeMenagePrice(params: MenageParams): PriceResult {
  const {
    surface,
    teamType,
    cleanType,
    squadSize = 3,
    propertyType = 'apartment',
    floors = 1,
  } = params;
  const workers = teamType === 'solo' ? 1 : teamType === 'duo' ? 2 : squadSize;

  let basePrice = Math.round(
    TEAM_COEFFICIENTS[teamType] * Math.pow(surface, SURFACE_EXPONENT),
  );

  if (teamType === 'squad' && squadSize > 3) {
    basePrice += (squadSize - 3) * SQUAD_EXTRA_MEMBER_SURCHARGE;
  }

  if (cleanType === 'deep') {
    const teamDeepMultiplier =
      Math.round((1 + DEEP_PREMIUM / workers) * 100) / 100;
    basePrice = Math.round(basePrice * teamDeepMultiplier);
  }

  if (teamType === 'squad') {
    basePrice = Math.max(basePrice, squadSize * MIN_SQUAD_PAY_PER_EMPLOYEE_MAD);
  }

  const normalizedFloors = Math.min(3, Math.max(1, floors));
  const floorsMultiplier =
    FLOORS_MULTIPLIERS[normalizedFloors] ?? FLOORS_MULTIPLIERS[1]!;
  const floorPrice = Math.round(
    basePrice * PROPERTY_MULTIPLIERS[propertyType] * floorsMultiplier,
  );
  const laborFloor = workers * LABOR_FLOOR_PER_WORKER;
  const finalPrice = Math.max(floorPrice, laborFloor);

  // Duration estimate
  const durRange =
    DURATION_RANGES.find((d) => surface <= d.maxSurface) ??
    DURATION_RANGES[DURATION_RANGES.length - 1]!;
  const multiplier = TEAM_DURATION_MULTIPLIER[teamType];

  return {
    floorPrice: finalPrice,
    ceiling: Math.round(finalPrice * NEGOTIATION_CEILING_MULTIPLIER),
    durationMinutes: {
      min: Math.round(durRange.base.min * multiplier),
      max: Math.round(durRange.base.max * multiplier),
    },
  };
}
