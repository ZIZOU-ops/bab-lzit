import type { CuisineParams, MealType, PriceResult } from './types';
import { NEGOTIATION_CEILING_MULTIPLIER } from './types';

interface Bracket {
  maxGuests: number;
  price: number;
}

interface DurationBracket {
  maxGuests: number;
  durationMinutes: { min: number; max: number };
}

const BRACKETS: Bracket[] = [
  { maxGuests: 4, price: 200 },
  { maxGuests: 7, price: 280 },
  { maxGuests: 10, price: 380 },
];

const EXTRA_PER_3_GUESTS = 50;
const EXTRA_BASE_PRICE = 380;
const MEAL_TYPE_MULTIPLIERS: Record<MealType, number> = {
  daily: 1.0,
  reception: 1.5,
  party: 2.0,
};
const DURATION_BRACKETS: DurationBracket[] = [
  { maxGuests: 4, durationMinutes: { min: 90, max: 120 } },
  { maxGuests: 7, durationMinutes: { min: 120, max: 180 } },
  { maxGuests: 10, durationMinutes: { min: 180, max: 240 } },
  { maxGuests: 15, durationMinutes: { min: 240, max: 300 } },
  { maxGuests: Infinity, durationMinutes: { min: 300, max: 420 } },
];

export function computeCuisinePrice(params: CuisineParams): PriceResult {
  const { guests, mealType = 'daily' } = params;

  const bracket = BRACKETS.find((b) => guests <= b.maxGuests);
  const durationBracket =
    DURATION_BRACKETS.find((b) => guests <= b.maxGuests) ??
    DURATION_BRACKETS[DURATION_BRACKETS.length - 1]!;

  let price: number;

  if (bracket) {
    price = bracket.price;
  } else {
    // Over 10 guests
    const extraGuests = guests - 10;
    price = EXTRA_BASE_PRICE + Math.ceil(extraGuests / 3) * EXTRA_PER_3_GUESTS;
  }

  const floorPrice = Math.round(price * MEAL_TYPE_MULTIPLIERS[mealType]);

  return {
    floorPrice,
    ceiling: Math.round(floorPrice * NEGOTIATION_CEILING_MULTIPLIER),
    durationMinutes: durationBracket.durationMinutes,
  };
}
