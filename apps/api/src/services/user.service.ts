import { ERROR_CODES } from '@babloo/shared/errors';
import type { PrismaClient } from '@prisma/client';
import type { Logger } from 'pino';
import { NotFoundError, ValidationError } from '../lib/errors';

type Deps = {
  db: PrismaClient;
  logger: Logger;
};

function isExpoPushToken(token: string) {
  return token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
}

export async function me(deps: Deps, userId: string) {
  const user = await deps.db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      role: true,
      locale: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError(ERROR_CODES.NOT_FOUND, 'User not found');
  }

  return user;
}

export async function updateProfile(
  deps: Deps,
  userId: string,
  input: { name?: string; locale?: 'fr' | 'ar' | 'en'; avatar?: string },
) {
  const updated = await deps.db.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { fullName: input.name } : {}),
      ...(input.locale !== undefined ? { locale: input.locale } : {}),
      ...(input.avatar !== undefined ? { avatarUrl: input.avatar } : {}),
    },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      role: true,
      locale: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

export async function registerPushToken(deps: Deps, userId: string, token: string) {
  if (!isExpoPushToken(token)) {
    throw new ValidationError(ERROR_CODES.VALIDATION_ERROR, 'Invalid Expo push token');
  }

  const user = await deps.db.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });

  if (!user) {
    throw new NotFoundError(ERROR_CODES.NOT_FOUND, 'User not found');
  }

  if (!user.pushTokens.includes(token)) {
    await deps.db.user.update({
      where: { id: userId },
      data: {
        pushTokens: {
          set: [...user.pushTokens, token],
        },
      },
    });
  }

  return { success: true };
}

export async function unregisterPushToken(deps: Deps, userId: string, token: string) {
  const user = await deps.db.user.findUnique({
    where: { id: userId },
    select: { pushTokens: true },
  });

  if (!user) {
    throw new NotFoundError(ERROR_CODES.NOT_FOUND, 'User not found');
  }

  await deps.db.user.update({
    where: { id: userId },
    data: {
      pushTokens: {
        set: user.pushTokens.filter((existingToken) => existingToken !== token),
      },
    },
  });

  return { success: true };
}
