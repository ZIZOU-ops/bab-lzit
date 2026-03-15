import { z } from 'zod';

export const roomJoinPayload = z.object({
  orderId: z.string(),
});

export const roomLeavePayload = z.object({
  orderId: z.string(),
});

export const messageSendPayload = z.object({
  orderId: z.string(),
  content: z.string().max(2000),
  clientMessageId: z.string().uuid(),
});

export const offerCreatePayload = z.object({
  orderId: z.string(),
  amount: z.number().positive().multipleOf(5),
});

export const offerAcceptPayload = z.object({
  orderId: z.string(),
  offerId: z.string(),
});

export const typingStartPayload = z.object({
  orderId: z.string(),
});

export const typingStopPayload = z.object({
  orderId: z.string(),
});

export const authRenewPayload = z.object({
  token: z.string(),
});
