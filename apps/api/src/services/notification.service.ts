import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { notificationJobId, notificationQueue } from '../jobs/queue';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

const MAX_DELAY_MS = 2_147_483_647;

function truncateMessage(content: string, max = 100) {
  if (content.length <= max) return content;
  return `${content.slice(0, max - 1)}…`;
}

const statusLabelFr = {
  draft: 'Brouillon',
  submitted: 'Soumise',
  searching: 'Recherche en cours',
  negotiating: 'Négociation',
  accepted: 'Acceptée',
  en_route: 'En route',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
} as const;

export async function sendPushNotification(
  deps: Deps,
  input: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    correlationId: string;
    delayMs?: number;
  },
) {
  await notificationQueue.add(
    'push',
    {
      userId: input.userId,
      title: input.title,
      body: input.body,
      data: input.data,
      correlationId: input.correlationId,
    },
    {
      jobId: notificationJobId({
        userId: input.userId,
        title: input.title,
        body: input.body,
        correlationId: input.correlationId,
      }),
      removeOnComplete: true,
      delay: input.delayMs,
    },
  );

  deps.logger.info(
    {
      userId: input.userId,
      title: input.title,
      correlationId: input.correlationId,
      delayMs: input.delayMs,
    },
    'Notification enqueued',
  );
}

export async function notifyNewMessage(
  deps: Deps,
  input: {
    orderId: string;
    senderId: string;
    content: string;
    correlationId: string;
  },
) {
  const order = await deps.db.order.findUnique({
    where: { id: input.orderId },
    select: {
      clientId: true,
      assignments: {
        select: {
          professional: { select: { userId: true } },
        },
      },
    },
  });

  if (!order) return;

  const participants = new Set<string>([
    order.clientId,
    ...order.assignments.map((assignment) => assignment.professional.userId),
  ]);
  participants.delete(input.senderId);

  await Promise.all(
    [...participants].map((userId) =>
      sendPushNotification(deps, {
        userId,
        title: 'Nouveau message',
        body: truncateMessage(input.content),
        data: { type: 'message', orderId: input.orderId },
        correlationId: input.correlationId,
      }),
    ),
  );
}

export async function notifyStatusChange(
  deps: Deps,
  input: {
    orderId: string;
    toStatus: keyof typeof statusLabelFr;
    correlationId: string;
  },
) {
  const order = await deps.db.order.findUnique({
    where: { id: input.orderId },
    select: {
      clientId: true,
      assignments: {
        select: {
          professional: { select: { userId: true } },
        },
      },
    },
  });

  if (!order) return;

  const recipients = new Set<string>([
    order.clientId,
    ...order.assignments.map((assignment) => assignment.professional.userId),
  ]);

  await Promise.all(
    [...recipients].map((userId) =>
      sendPushNotification(deps, {
        userId,
        title: 'Commande mise à jour',
        body: `Statut: ${statusLabelFr[input.toStatus] ?? input.toStatus}`,
        data: { type: 'status', orderId: input.orderId, status: input.toStatus },
        correlationId: input.correlationId,
      }),
    ),
  );
}

export async function notifyNewOffer(
  deps: Deps,
  input: {
    orderId: string;
    proUserId: string;
    correlationId: string;
  },
) {
  await sendPushNotification(deps, {
    userId: input.proUserId,
    title: 'Nouvelle mission',
    body: 'Vous avez été assigné à une nouvelle mission',
    data: { type: 'offer', orderId: input.orderId },
    correlationId: input.correlationId,
  });
}

export async function notifyRatePrompt(
  deps: Deps,
  input: {
    orderId: string;
    clientUserId: string;
    correlationId: string;
  },
) {
  await sendPushNotification(deps, {
    userId: input.clientUserId,
    title: 'Évaluez le service',
    body: 'Comment s\'est passé votre service ?',
    data: { type: 'rate', orderId: input.orderId },
    correlationId: input.correlationId,
  });
}

export async function scheduleServiceReminder(
  deps: Deps,
  input: {
    orderId: string;
    proUserId: string;
    scheduledStartAt: Date;
    correlationId: string;
  },
) {
  const reminderAt = input.scheduledStartAt.getTime() - 60 * 60 * 1000;
  const delayMs = reminderAt - Date.now();

  if (delayMs <= 0 || delayMs > MAX_DELAY_MS) {
    return;
  }

  await sendPushNotification(deps, {
    userId: input.proUserId,
    title: 'Rappel de mission',
    body: 'Votre mission commence dans 1 heure',
    data: { type: 'reminder', orderId: input.orderId },
    correlationId: input.correlationId,
    delayMs,
  });
}
