import { Worker } from 'bullmq';
import { logger } from '../lib/logger';
import { db } from '../lib/prisma';
import { bullConnection } from './queue';

export function createCleanupWorker() {
  return new Worker(
    'cleanup',
    async () => {
      const now = new Date();

      await Promise.all([
        db.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
        db.otpChallenge.deleteMany({ where: { expiresAt: { lt: now } } }),
        db.idempotencyKey.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
      ]);

      logger.info('Cleanup job finished');
    },
    {
      connection: bullConnection,
      concurrency: 1,
    },
  );
}
