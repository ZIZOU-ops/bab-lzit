import type { DemandLevel, TimeSlotKey } from '@babloo/shared/pricing';

export type BookingDraft = {
  serviceType: 'menage' | 'cuisine' | 'childcare';
  neighborhoodId?: string;
  schedule?: {
    selectedDate: string;
    selectedTimeSlot: TimeSlotKey;
    demandLevel: DemandLevel;
    demandMultiplier: number;
  };
  detail: Record<string, unknown>;
  estimate: {
    floorPrice: number;
    recommendedPrice: number;
    ceilingPrice?: number;
    ceiling: number;
    durationMinutes: { min: number; max: number };
  };
};

let draft: BookingDraft | null = null;
let selectedNeighborhoodId: string | null = null;

export function setBookingDraft(nextDraft: BookingDraft) {
  draft = nextDraft;
}

export function getBookingDraft() {
  return draft;
}

export function clearBookingDraft() {
  draft = null;
}

export function setBookingNeighborhoodId(neighborhoodId: string | null) {
  selectedNeighborhoodId = neighborhoodId;
}

export function getBookingNeighborhoodId() {
  return selectedNeighborhoodId;
}
