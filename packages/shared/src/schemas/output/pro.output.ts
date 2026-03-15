import { z } from 'zod';

export const proProfileOutput = z.object({
  id: z.string(),
  userId: z.string(),
  skills: z.array(z.string()),
  zones: z.array(z.string()),
  rating: z.number().nullable(),
  reliability: z.number().nullable(),
  isAvailable: z.boolean(),
  isTeamLead: z.boolean(),
  createdAt: z.string(),
});

export const assignmentOutput = z.object({
  id: z.string(),
  orderId: z.string(),
  proId: z.string(),
  role: z.string(),
  status: z.string(),
  confirmedAt: z.string().nullable(),
});
