import type { CleanType, TeamType } from '../types/enums';
import type { DemandLevel } from './demand';

export const PROPERTY_TYPES = ['apartment', 'villa', 'riad', 'office'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const MEAL_TYPES = ['daily', 'reception', 'party'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface MenageParams {
  surface: number;
  teamType: TeamType;
  cleanType: CleanType;
  squadSize?: number; // 3-5, only when teamType=squad
  propertyType?: PropertyType;
  floors?: number;
  neighborhoodId?: string;
  demandLevel?: DemandLevel;
}

export interface CuisineParams {
  guests: number;
  mealType?: MealType;
  neighborhoodId?: string;
  demandLevel?: DemandLevel;
}

export interface ChildcareParams {
  children: number;
  hours: number;
  neighborhoodId?: string;
  demandLevel?: DemandLevel;
}

export interface PriceResult {
  floorPrice: number;
  ceiling: number;
  durationMinutes: { min: number; max: number };
}

export const MIN_SQUAD_PAY_PER_EMPLOYEE_MAD = 100;
export const NEGOTIATION_CEILING_MULTIPLIER = 2.5;
export const NEGOTIATION_INCREMENT = 5;
export const PRO_FLOOR_DISCOUNT = 0.10;

export function isValidOfferAmount(
  amount: number,
  floorPrice: number,
  ceiling = Math.round(floorPrice * NEGOTIATION_CEILING_MULTIPLIER),
) {
  if (!Number.isFinite(amount) || !Number.isFinite(floorPrice) || !Number.isFinite(ceiling)) {
    return false;
  }

  if (amount < floorPrice || amount > ceiling) {
    return false;
  }

  return amount % NEGOTIATION_INCREMENT === 0;
}

export function isValidProOfferAmount(
  amount: number,
  floorPrice: number,
  ceiling: number,
): boolean {
  if (!Number.isFinite(amount) || !Number.isFinite(floorPrice) || !Number.isFinite(ceiling)) {
    return false;
  }

  const hardFloor = Math.round(floorPrice * (1 - PRO_FLOOR_DISCOUNT));
  return amount >= hardFloor && amount <= ceiling && amount % NEGOTIATION_INCREMENT === 0;
}
