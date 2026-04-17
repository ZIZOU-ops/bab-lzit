export const TIME_SLOT_KEYS = [
  'early_morning',
  'morning',
  'midday',
  'afternoon',
  'evening',
] as const;

export const DEMAND_LEVELS = ['green', 'yellow', 'red'] as const;

export type DemandLevel = (typeof DEMAND_LEVELS)[number];
export type TimeSlotKey = (typeof TIME_SLOT_KEYS)[number];

export const TIME_SLOTS: Record<TimeSlotKey, { start: string; end: string; label: string }> = {
  early_morning: { start: '07:00', end: '08:00', label: '7h - 8h' },
  morning: { start: '08:00', end: '10:00', label: '8h - 10h' },
  midday: { start: '10:00', end: '16:00', label: '10h - 16h' },
  afternoon: { start: '16:00', end: '18:00', label: '16h - 18h' },
  evening: { start: '18:00', end: '21:00', label: '18h - 21h' },
};

export const DEMAND_MULTIPLIERS: Record<DemandLevel, number> = {
  green: 1.0,
  yellow: 1.10,
  red: 1.20,
};

export const DEFAULT_DEMAND_LEVEL: DemandLevel = 'green';

export function getDemandMultiplier(level: DemandLevel | undefined): number {
  return DEMAND_MULTIPLIERS[level ?? DEFAULT_DEMAND_LEVEL];
}

export function getDayDemandLevel(slotLevels: DemandLevel[]): DemandLevel {
  if (slotLevels.includes('red')) return 'red';
  if (slotLevels.includes('yellow')) return 'yellow';
  return 'green';
}
