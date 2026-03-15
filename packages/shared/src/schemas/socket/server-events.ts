import { z } from 'zod';

export const messageNewPayload = z.object({
  id: z.string(),
  orderId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  content: z.string(),
  seq: z.number().int(),
  clientMessageId: z.string().nullable(),
  createdAt: z.string(),
});

export const offerNewPayload = z.object({
  id: z.string(),
  orderId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  amount: z.number(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  seq: z.number().int(),
  createdAt: z.string(),
  acceptedAt: z.string().nullable(),
});

export const offerAcceptedPayload = z.object({
  orderId: z.string(),
  offerId: z.string(),
  finalPrice: z.number(),
});

export const typingIndicatorPayload = z.object({
  orderId: z.string(),
  userId: z.string(),
  userName: z.string(),
  isTyping: z.boolean(),
});

export const statusUpdatePayload = z.object({
  orderId: z.string(),
  status: z.enum([
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
  updatedAt: z.string(),
});

export const errorPayload = z.object({
  code: z.string(),
  message: z.string(),
});
