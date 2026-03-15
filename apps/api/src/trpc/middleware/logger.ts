import { middleware } from '../core';

export const logProcedure = middleware(async ({ path, ctx, next }) => {
  const startedAt = Date.now();
  ctx.logger.debug({ procedure: path, requestId: ctx.requestId }, 'tRPC procedure start');

  const result = await next();

  ctx.logger.info(
    {
      procedure: path,
      durationMs: Date.now() - startedAt,
      requestId: ctx.requestId,
    },
    'tRPC procedure end',
  );

  return result;
});
