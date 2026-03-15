import { z } from 'zod';
import {
  adminPriceOverrideSchema,
  adminStatusOverrideSchema,
  adminUserToggleSchema,
  auditLogInput,
} from '@babloo/shared';
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
