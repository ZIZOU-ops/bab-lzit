export type BookingDraft = {
  serviceType: 'menage' | 'cuisine' | 'childcare';
  detail: Record<string, unknown>;
  estimate: {
    floorPrice: number;
    ceilingPrice?: number;
    ceiling: number;
    durationMinutes: { min: number; max: number };
  };
};

let draft: BookingDraft | null = null;

export function setBookingDraft(nextDraft: BookingDraft) {
  draft = nextDraft;
}

export function getBookingDraft() {
  return draft;
}

export function clearBookingDraft() {
  draft = null;
}
