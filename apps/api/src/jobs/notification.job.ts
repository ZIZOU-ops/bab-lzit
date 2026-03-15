import { Worker, type Job } from 'bullmq';
import { logger } from '../lib/logger';
import { db } from '../lib/prisma';
import { bullConnection } from './queue';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type PushJobData = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  correlationId: string;
};

function isExpoPushToken(token: string) {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

async function removePushToken(userId: string, token: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });

  if (!user) return;

  const nextTokens = user.pushTokens.filter((existingToken) => existingToken !== token);
  if (nextTokens.length === user.pushTokens.length) return;

  await db.user.update({
    where: { id: userId },
    data: { pushTokens: { set: nextTokens } },
  });
}

async function sendToToken(jobData: PushJobData, token: string) {
  if (!isExpoPushToken(token)) {
    await removePushToken(jobData.userId, token);
    return;
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title: jobData.title,
      body: jobData.body,
      data: jobData.data,
      sound: 'default',
      badge: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: {
      status?: 'ok' | 'error';
      details?: { error?: string };
    };
  };

  if (payload.data?.status === 'error' && payload.data.details?.error === 'DeviceNotRegistered') {
    await removePushToken(jobData.userId, token);
  }
}

export function createNotificationWorker() {
  return new Worker(
    'notification',
    async (job: Job<PushJobData>) => {
      const user = await db.user.findUnique({
        where: { id: job.data.userId },
        select: { pushTokens: true },
      });

      if (!user || user.pushTokens.length === 0) {
        return;
      }

      await Promise.all(user.pushTokens.map((token) => sendToToken(job.data, token)));
    },
    {
      connection: bullConnection,
      concurrency: 10,
    },
  );
}

export function attachNotificationWorkerLogging(worker: Worker) {
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notification job completed');
  });

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'Notification job failed');
  });
}
