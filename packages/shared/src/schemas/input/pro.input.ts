import { z } from 'zod';

export const toggleAvailabilityInput = z.object({
  available: z.boolean(),
});
