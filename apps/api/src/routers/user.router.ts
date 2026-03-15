import { pushTokenInput, updateProfileInput } from '@babloo/shared';
import { AppError } from '../lib/errors';
import { protectedProcedure, router } from '../trpc';
import * as userService from '../services/user.service';

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

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) =>
    withAppErrorMapping(() => userService.me({ db: ctx.db, logger: ctx.logger }, ctx.user.id)),
  ),

  updateProfile: protectedProcedure.input(updateProfileInput).mutation(({ ctx, input }) =>
    withAppErrorMapping(() =>
      userService.updateProfile(
        { db: ctx.db, logger: ctx.logger },
        ctx.user.id,
        {
          name: input.name,
          locale: input.locale,
          avatar: input.avatar,
        },
      ),
    ),
  ),

  registerPushToken: protectedProcedure
    .input(pushTokenInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        userService.registerPushToken(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input.token,
        ),
      ),
    ),

  unregisterPushToken: protectedProcedure
    .input(pushTokenInput)
    .mutation(({ ctx, input }) =>
      withAppErrorMapping(() =>
        userService.unregisterPushToken(
          { db: ctx.db, logger: ctx.logger },
          ctx.user.id,
          input.token,
        ),
      ),
    ),
});
