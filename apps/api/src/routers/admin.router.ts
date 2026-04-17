import { z } from 'zod';
import {
  adminPriceOverrideSchema,
  adminStatusOverrideSchema,
  adminUserToggleSchema,
  auditLogInput,
} from '@babloo/shared';
import { DEMAND_LEVELS, TIME_SLOT_KEYS } from '@babloo/shared/pricing';
import { OrderStatus } from '@prisma/client';
import { AppError } from '../lib/errors';
import { adminProcedure, router } from '../trpc';
import * as adminService from '../services/admin.service';

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

export const adminRouter = router({
  setDemandSlots: adminProcedure
    .input(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        slots: z.array(
          z.object({
            timeSlot: z.enum(TIME_SLOT_KEYS),
            level: z.enum(DEMAND_LEVELS),
          }),
        ),
      }),
    )
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        adminService.setDemandSlots({ db: ctx.db, logger: ctx.logger }, input),
      ),
    ),

  bulkSetDemand: adminProcedure
    .input(
      z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        level: z.enum(DEMAND_LEVELS),
        timeSlots: z.array(z.enum(TIME_SLOT_KEYS)).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        adminService.bulkSetDemand({ db: ctx.db, logger: ctx.logger }, input),
      ),
    ),

  overrideStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        ...adminStatusOverrideSchema.shape,
      }),
    )
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        adminService.overrideOrderStatus(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input.orderId,
          input.toStatus as OrderStatus,
          input.reason,
        ),
      ),
    ),

  overridePrice: adminProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        ...adminPriceOverrideSchema.shape,
      }),
    )
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        adminService.overrideOrderPrice(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input.orderId,
          input.finalPrice,
          input.reason,
        ),
      ),
    ),

  toggleUser: adminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        ...adminUserToggleSchema.shape,
      }),
    )
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        adminService.toggleUserActive(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input.userId,
          input.isActive,
        ),
      ),
    ),

  auditLog: adminProcedure.input(auditLogInput).query(({ ctx, input }) =>
    withAppErrorMapping(() =>
      adminService.getAuditLog(
        { db: ctx.db, logger: ctx.logger },
        input.cursor,
        input.limit,
      ),
    ),
  ),
});
