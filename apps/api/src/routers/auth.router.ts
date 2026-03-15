import {
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  signupSchema,
} from '@babloo/shared';
import * as authService from '../services/auth.service';
import { AppError } from '../lib/errors';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { logProcedure } from '../trpc/middleware/logger';

const loggedProcedure = publicProcedure.use(logProcedure);

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

export const authRouter = router({
  signup: loggedProcedure.input(signupSchema).mutation(async ({ ctx, input }) =>
    withAppErrorMapping(() =>
      authService.signup(
        {
          db: ctx.db,
          redis: ctx.redis,
          logger: ctx.logger,
        },
        input,
      ),
    ),
  ),

  login: loggedProcedure.input(loginSchema).mutation(async ({ ctx, input }) =>
    withAppErrorMapping(() =>
      authService.login(
        {
          db: ctx.db,
          redis: ctx.redis,
          logger: ctx.logger,
        },
        input,
      ),
    ),
  ),

  otpRequest: loggedProcedure
    .input(otpRequestSchema)
    .mutation(async ({ ctx, input }) =>
      withAppErrorMapping(() =>
        authService.otpRequest(
          {
            db: ctx.db,
            redis: ctx.redis,
            logger: ctx.logger,
          },
          input,
        ),
      ),
    ),

  otpVerify: loggedProcedure
    .input(otpVerifySchema)
    .mutation(async ({ ctx, input }) =>
      withAppErrorMapping(() =>
        authService.otpVerify(
          {
            db: ctx.db,
            redis: ctx.redis,
            logger: ctx.logger,
          },
          input,
        ),
      ),
    ),

  refresh: loggedProcedure.input(refreshSchema).mutation(async ({ ctx, input }) =>
    withAppErrorMapping(() =>
      authService.refresh(
        {
          db: ctx.db,
          redis: ctx.redis,
          logger: ctx.logger,
        },
        { refreshToken: input.refreshToken },
      ),
    ),
  ),

  logout: protectedProcedure
    .input(refreshSchema)
    .mutation(async ({ ctx, input }) =>
      withAppErrorMapping(() =>
        authService.logout(
          {
            db: ctx.db,
            redis: ctx.redis,
            logger: ctx.logger,
          },
          ctx.user.id,
          input.refreshToken,
        ),
      ),
    ),

  logoutAll: protectedProcedure.mutation(async ({ ctx }) =>
    withAppErrorMapping(() =>
      authService.logoutAll(
        {
          db: ctx.db,
          redis: ctx.redis,
          logger: ctx.logger,
        },
        ctx.user.id,
      ),
    ),
  ),
});
