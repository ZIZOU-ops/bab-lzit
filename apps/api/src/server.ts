import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { env } from './config/env';
import { createCleanupWorker } from './jobs/cleanup.job';
import {
  attachNotificationWorkerLogging,
  createNotificationWorker,
} from './jobs/notification.job';
import { ensureCleanupSchedule } from './jobs/queue';
import { db } from './lib/prisma';
import { redis } from './lib/redis';
import { logger } from './lib/logger';
import { attachSocketServer } from './socket/setup';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';

export async function buildServer() {
  const app = fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(',').map((v) => v.trim()),
    credentials: true,
  });

  await app.register(helmet);

  await app.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext,
    },
  });

  app.get('/healthz', async () => ({ status: 'ok' }));

  app.get('/readyz', async (_, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      await redis.ping();
      return { status: 'ok' };
    } catch (error) {
      app.log.error({ error }, 'Readiness check failed');
      reply.status(503);
      return { status: 'not-ready' };
    }
  });

  attachSocketServer({
    app,
    db,
    redis,
    corsOrigins: env.CORS_ORIGINS.split(',').map((v) => v.trim()),
    logger,
  });

  return app;
}

async function main() {
  const app = await buildServer();
  const workers: Array<{ close: () => Promise<void> }> = [];

  if (env.NODE_ENV !== 'test') {
    const notificationWorker = createNotificationWorker();
    attachNotificationWorkerLogging(notificationWorker);
    const cleanupWorker = createCleanupWorker();
    await ensureCleanupSchedule();
    workers.push(notificationWorker, cleanupWorker);
  }

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Graceful shutdown start');
    await app.close();
    await Promise.all(workers.map(async (worker) => worker.close()));
    await redis.quit();
    await db.$disconnect();
    process.exit(0);
  };

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  await app.listen({
    port: env.PORT,
    host: '0.0.0.0',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
