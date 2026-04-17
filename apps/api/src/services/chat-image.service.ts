import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ERROR_CODES } from '@babloo/shared/errors';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../lib/errors';
import { checkParticipant } from './negotiation.service';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

const CHAT_IMAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../uploads/chat',
);

const IMAGE_ROUTE_PREFIX = '/chat-images';

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  heic: 'image/heic',
  heif: 'image/heif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function normalizeMimeType(mimeType: string) {
  if (mimeType === 'image/jpg') {
    return 'image/jpeg';
  }

  return mimeType.trim().toLowerCase();
}

function validateFileName(fileName: string) {
  if (!/^[a-z0-9-]+\.(jpg|jpeg|png|webp|heic|heif)$/i.test(fileName)) {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Invalid chat image name');
  }

  return fileName;
}

async function ensureNegotiationOpen(deps: Deps, userId: string, orderId: string) {
  const { order } = await checkParticipant(deps, userId, orderId);

  if (order.status !== 'negotiating') {
    throw new ConflictError(
      ERROR_CODES.NEG_ORDER_NOT_NEGOTIATING,
      'Order is not in negotiating state',
    );
  }
}

export async function uploadChatImage(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
    data: string;
    mimeType: string;
  },
) {
  await ensureNegotiationOpen(deps, input.userId, input.orderId);

  const mimeType = normalizeMimeType(input.mimeType);
  const extension = EXTENSION_BY_MIME_TYPE[mimeType];

  if (!extension) {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Unsupported image type');
  }

  if (input.data.trim().length === 0) {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Missing image payload');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.data, 'base64');
  } catch {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Invalid image payload');
  }

  if (buffer.length === 0 || buffer.length > 4 * 1024 * 1024) {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Image is too large');
  }

  const fileName = `${randomUUID()}.${extension}`;
  const orderDir = path.join(CHAT_IMAGE_ROOT, input.orderId);
  const filePath = path.join(orderDir, fileName);

  await fs.mkdir(orderDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return {
    path: `${IMAGE_ROUTE_PREFIX}/${input.orderId}/${fileName}`,
  };
}

export async function readChatImage(
  deps: Deps,
  input: {
    orderId: string;
    userId: string;
    fileName: string;
  },
) {
  await checkParticipant(deps, input.userId, input.orderId);

  const fileName = validateFileName(input.fileName);
  const extension = path.extname(fileName).slice(1).toLowerCase();
  const mimeType = MIME_TYPE_BY_EXTENSION[extension];

  if (!mimeType) {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Unsupported image type');
  }

  const filePath = path.join(CHAT_IMAGE_ROOT, input.orderId, fileName);

  try {
    const buffer = await fs.readFile(filePath);
    return { buffer, mimeType };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      throw new NotFoundError(ERROR_CODES.NOT_FOUND, 'Chat image not found');
    }

    throw error;
  }
}
