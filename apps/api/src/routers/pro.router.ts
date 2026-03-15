import { z } from 'zod';
import { toggleAvailabilityInput } from '@babloo/shared';
import { AppError } from '../lib/errors';
import { protectedProcedure, router } from '../trpc';
import { requireRole } from '../trpc/middleware/role';
import * as proService from '../services/pro.service';

const proProcedure = protectedProcedure.use(requireRole('pro'));

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

export const proRouter = router({
  profile: proProcedure.query(({ ctx }) =>
    withAppErrorMapping(() =>
      proService.getProfile({ db: ctx.db, logger: ctx.logger }, ctx.user.id),
    ),
  ),

  toggleAvailability: proProcedure
    .input(toggleAvailabilityInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.toggleAvailability(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input.available,
        ),
      ),
    ),

  orders: proProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.getProOrders(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input,
        ),
      ),
    ),

  openSlots: proProcedure.query(({ ctx }) =>
    withAppErrorMapping(() =>
      proService.getOpenSlots({ db: ctx.db, logger: ctx.logger }, ctx.user.id),
    ),
  ),

  createJoinRequest: proProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.createJoinRequest(
          { db: ctx.db, logger: ctx.logger },
          input.orderId,
          ctx.user.id,
        ),
      ),
    ),

  joinRequests: proProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.getJoinRequests(
          { db: ctx.db, logger: ctx.logger },
          input.orderId,
          ctx.user.id,
        ),
      ),
    ),

  approveAssignment: proProcedure
    .input(z.object({ assignmentId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.approveAssignment(
          { db: ctx.db, logger: ctx.logger },
          input.assignmentId,
          ctx.user.id,
        ),
      ),
    ),

  rejectAssignment: proProcedure
    .input(z.object({ assignmentId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.rejectAssignment(
          { db: ctx.db, logger: ctx.logger },
          input.assignmentId,
          ctx.user.id,
        ),
      ),
    ),

  confirmAssignment: proProcedure
    .input(z.object({ assignmentId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.confirmAssignment(
          { db: ctx.db, logger: ctx.logger },
          input.assignmentId,
          ctx.user.id,
        ),
      ),
    ),

  declineAssignment: proProcedure
    .input(z.object({ assignmentId: z.string().uuid() }))
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        proService.declineAssignment(
          { db: ctx.db, logger: ctx.logger },
          input.assignmentId,
          ctx.user.id,
        ),
      ),
    ),
});
