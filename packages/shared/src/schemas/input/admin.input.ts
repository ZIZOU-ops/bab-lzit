import { z } from 'zod';

export const adminStatusOverrideSchema = z.object({
  toStatus: z.enum([
    'draft',
    'submitted',
    'searching',
    'negotiating',
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  reason: z.string().max(500).trim().optional(),
});

export const adminPriceOverrideSchema = z.object({
  finalPrice: z.number().int().min(0),
  reason: z.string().max(500).trim().optional(),
});

export const adminUserToggleSchema = z.object({
  isActive: z.boolean(),
});

export const auditLogInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().max(100).default(50).optional(),
});
