import { z } from 'zod';

export const messageOutput = z.object({
  id: z.string(),
  orderId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  content: z.string(),
  seq: z.number().int(),
  clientMessageId: z.string().nullable(),
  createdAt: z.string(),
});

export const offerOutput = z.object({
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
