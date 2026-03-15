import type { CleanType, TeamType } from '../types/enums';

export interface MenageParams {
  surface: number;
  teamType: TeamType;
  cleanType: CleanType;
  squadSize?: number; // 3-5, only when teamType=squad
}

export interface CuisineParams {
  guests: number;
}

export interface ChildcareParams {
  children: number;
  hours: number;
}

export interface PriceResult {
  floorPrice: number;
  ceiling: number;
  durationMinutes: { min: number; max: number };
}

export const MIN_SQUAD_PAY_PER_EMPLOYEE_MAD = 100;
export const NEGOTIATION_CEILING_MULTIPLIER = 2.5;
export const NEGOTIATION_INCREMENT = 5;

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
