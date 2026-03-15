import { TRPCError } from '@trpc/server';
import { middleware } from '../core';

export const isAuthenticated = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
