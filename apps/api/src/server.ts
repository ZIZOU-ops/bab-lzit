import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { ForbiddenError, NotFoundError, ValidationError } from './lib/errors';
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
import { verifyAccessToken } from './lib/jwt';
import { logger } from './lib/logger';
import { readChatImage } from './services/chat-image.service';
import { attachSocketServer } from './socket/setup';
import { createContext } from './trpc/context';
import { appRouter } from './trpc/router';

function extractBearerToken(authHeader?: string) {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export async function buildServer() {
  const app = fastify({ loggerInstance: logger, bodyLimit: 8 * 1024 * 1024 });

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

  app.get<{
    Params: {
      orderId: string;
      fileName: string;
    };
  }>('/chat-images/:orderId/:fileName', async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      reply.status(401);
      return { message: 'Unauthorized' };
    }

    try {
      const payload = verifyAccessToken(token);
      const image = await readChatImage(
        { db, logger },
        {
          orderId: request.params.orderId,
          userId: payload.userId,
          fileName: request.params.fileName,
        },
      );

      reply
        .type(image.mimeType)
        .header('Cache-Control', 'private, max-age=86400')
        .send(image.buffer);
      return reply;
    } catch (error) {
      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        reply.status(401);
        return { message: 'Unauthorized' };
      }
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        reply.status(401);
        return { message: 'Unauthorized' };
      }
      if (error instanceof ForbiddenError) {
        reply.status(403);
        return { message: error.message };
      }
      if (error instanceof NotFoundError) {
        reply.status(404);
        return { message: error.message };
      }
      if (error instanceof ValidationError) {
        reply.status(400);
        return { message: error.message };
      }

      request.log.error({ error }, 'Failed to serve chat image');
      reply.status(500);
      return { message: 'Internal server error' };
    }
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
