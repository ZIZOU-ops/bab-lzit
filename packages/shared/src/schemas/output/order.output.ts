import { z } from 'zod';
import { OrderStatus, ServiceType } from '../../types/enums';

export const orderSummaryOutput = z.object({
  id: z.string(),
  serviceType: z.nativeEnum(ServiceType),
  status: z.nativeEnum(OrderStatus),
  scheduledAt: z.string().nullable(),
  address: z.string(),
  floorPrice: z.number().nullable(),
  finalPrice: z.number().nullable(),
  createdAt: z.string(),
});

export const orderDetailOutput = orderSummaryOutput.extend({
  detail: z.unknown(),
  assignments: z.array(z.unknown()),
  notes: z.string().nullable().optional(),
});

export const orderListOutput = z.object({
  items: z.array(orderSummaryOutput),
  nextCursor: z.string().nullable(),
});
