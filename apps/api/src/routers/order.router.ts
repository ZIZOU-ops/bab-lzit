import { z } from 'zod';
import { OrderStatus, ServiceType } from '@prisma/client';
import { createOrderSchema, ratingSchema } from '@babloo/shared';
import { AppError } from '../lib/errors';
import { protectedProcedure, router } from '../trpc';
import { requireRole } from '../trpc/middleware/role';
import * as orderService from '../services/order.service';

async function withAppErrorMapping<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof AppError) {
      throw error.toTRPCError();
    }
    throw error;
  }
}

const listInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20).optional(),
});

const byIdInput = z.object({
  orderId: z.string().uuid(),
});

const cancelInput = z.object({
  orderId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

const updateStatusInput = z.object({
  orderId: z.string().uuid(),
  status: z.nativeEnum(OrderStatus),
  reason: z.string().max(500).optional(),
});

const rateInput = z.object({
  orderId: z.string().uuid(),
  ...ratingSchema.shape,
});

export const orderRouter = router({
  create: protectedProcedure
    .use(requireRole('client'))
    .input(createOrderSchema)
    .mutation(({ ctx, input }) => {
      const serviceInput = {
        ...input,
        serviceType: input.serviceType as ServiceType,
      };

      return withAppErrorMapping(() =>
        orderService.create(
          {
            db: ctx.db,
            logger: ctx.logger,
          },
          ctx.user.id,
          serviceInput,
        ),
      );
    }),

  list: protectedProcedure.input(listInput).query(({ ctx, input }) =>
    withAppErrorMapping(() =>
      orderService.list(
        {
          db: ctx.db,
          logger: ctx.logger,
        },
        {
          userId: ctx.user.id,
          cursor: input.cursor,
          limit: input.limit ?? 20,
        },
      ),
    ),
  ),

  byId: protectedProcedure.input(byIdInput).query(({ ctx, input }) =>
    withAppErrorMapping(() =>
      orderService.getById(
        {
          db: ctx.db,
          logger: ctx.logger,
        },
        ctx.user.id,
        input.orderId,
      ),
    ),
  ),

  cancel: protectedProcedure
    .use(requireRole('client'))
    .input(cancelInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        orderService.cancel(
          {
            db: ctx.db,
            logger: ctx.logger,
          },
          ctx.user.id,
          input.orderId,
          input.reason,
        ),
      ),
    ),

  updateStatus: protectedProcedure
    .use(requireRole('pro'))
    .input(updateStatusInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        orderService.updateStatus(
          {
            db: ctx.db,
            logger: ctx.logger,
          },
          ctx.user.id,
          input.orderId,
          input.status,
          input.reason,
        ),
      ),
    ),

  rate: protectedProcedure
    .use(requireRole('client'))
    .input(rateInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        orderService.rate(
          {
            db: ctx.db,
            logger: ctx.logger,
          },
          ctx.user.id,
          input.orderId,
          input.stars,
          input.comment,
        ),
      ),
    ),
});
