import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import type { Context } from './context';

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const appCode =
      error.cause &&
      typeof error.cause === 'object' &&
      'code' in error.cause &&
      typeof (error.cause as { code?: unknown }).code === 'string'
        ? ((error.cause as { code: string }).code ?? null)
        : null;

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
        appCode,
      },
    };
  },
});

export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
