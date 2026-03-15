import { Queue } from 'bullmq';
import { env } from '../config/env';

const redisUrl = new URL(env.REDIS_URL);

export const bullConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  ...(redisUrl.password ? { password: redisUrl.password } : {}),
};

export const notificationQueue = new Queue('notification', {
  connection: bullConnection,
});

export const cleanupQueue = new Queue('cleanup', {
  connection: bullConnection,
});

export async function ensureCleanupSchedule() {
  await cleanupQueue.upsertJobScheduler(
    'daily-cleanup',
    { every: 3600000 },
    {},
  );
}

export function notificationJobId(input: {
  userId: string;
  title: string;
  body: string;
  correlationId: string;
}) {
  return `push_${input.userId}_${input.correlationId}_${Buffer.from(
    `${input.title}|${input.body}`,
  ).toString('base64url')}`;
}
