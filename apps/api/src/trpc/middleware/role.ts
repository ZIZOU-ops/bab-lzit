import { TRPCError } from '@trpc/server';
import { middleware } from '../core';

export function requireRole(role: string) {
  return middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    if (ctx.user.role !== role) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient role' });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });
}
