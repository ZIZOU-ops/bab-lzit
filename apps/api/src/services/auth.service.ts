import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { normalizePhone } from '@babloo/shared';
import { ERROR_CODES } from '@babloo/shared/errors';
import type { PrismaClient } from '@prisma/client';
import type Redis from 'ioredis';
import type { Logger } from 'pino';
import { env } from '../config/env';
import { generateRefreshToken, hashToken, issueAccessToken } from '../lib/jwt';
import {
  AuthError,
  ConflictError,
  RateLimitError,
  ValidationError,
} from '../lib/errors';

type Deps = {
  db: PrismaClient;
  redis: Redis;
  logger: Logger;
};

type SignupInput = {
  email?: string;
  phone?: string;
  password?: string;
  fullName: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type OtpRequestInput = {
  phone: string;
  purpose: 'login' | 'signup' | 'reset';
};

type OtpVerifyInput = {
  challengeId: string;
  code: string;
  fullName?: string;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

function generateFamily() {
  return crypto.randomUUID();
}

function buildTokenPair(
  user: { id: string; role: string; locale: string; fullName: string },
  refreshToken: string,
) {
  return {
    accessToken: issueAccessToken({
      userId: user.id,
      role: user.role,
      locale: user.locale,
      fullName: user.fullName,
    }),
    refreshToken,
  };
}

async function createRefreshToken(deps: Deps, userId: string, family: string): Promise<string> {
  const raw = generateRefreshToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await deps.db.refreshToken.create({
    data: {
      userId,
      tokenHash,
      family,
      expiresAt,
    },
  });

  return raw;
}

export async function signup(deps: Deps, input: SignupInput): Promise<TokenPair> {
  const normalizedEmail = input.email?.toLowerCase().trim();
  const phone = input.phone ? normalizePhone(input.phone) : undefined;

  if (!normalizedEmail && !phone) {
    throw new ValidationError(
      ERROR_CODES.AUTH_MISSING_IDENTIFIER,
      'Email or phone is required',
    );
  }

  if (normalizedEmail) {
    const existingByEmail = await deps.db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingByEmail) {
      throw new ConflictError(ERROR_CODES.AUTH_EMAIL_EXISTS, 'Email already exists');
    }
  }

  if (phone) {
    const existingByPhone = await deps.db.user.findUnique({ where: { phone } });
    if (existingByPhone) {
      throw new ConflictError(ERROR_CODES.AUTH_PHONE_EXISTS, 'Phone already exists');
    }
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, env.BCRYPT_ROUNDS)
    : null;

  const user = await deps.db.user.create({
    data: {
      email: normalizedEmail ?? null,
      phone: phone ?? null,
      passwordHash,
      fullName: input.fullName,
      role: 'client',
    },
  });

  const family = generateFamily();
  const refreshToken = await createRefreshToken(deps, user.id, family);
  return buildTokenPair(user, refreshToken);
}

export async function login(deps: Deps, input: LoginInput): Promise<TokenPair> {
  const normalizedEmail = input.email.toLowerCase().trim();
  const user = await deps.db.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || !user.passwordHash || !user.isActive) {
    throw new AuthError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
  }

  const family = generateFamily();
  const refreshToken = await createRefreshToken(deps, user.id, family);
  return buildTokenPair(user, refreshToken);
}

export async function otpRequest(deps: Deps, input: OtpRequestInput): Promise<{ challengeId: string }> {
  const normalizedPhone = normalizePhone(input.phone);

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentCount = await deps.db.otpChallenge.count({
    where: {
      phone: normalizedPhone,
      createdAt: { gte: fifteenMinAgo },
    },
  });

  if (recentCount >= env.OTP_RATE_LIMIT_PER_15MIN) {
    throw new RateLimitError(
      ERROR_CODES.AUTH_OTP_RATE_LIMITED,
      'Too many OTP requests. Try again later.',
    );
  }

  const code =
    env.NODE_ENV === 'production'
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '123456';

  const codeHash = await bcrypt.hash(code, env.BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  const challenge = await deps.db.otpChallenge.create({
    data: {
      phone: normalizedPhone,
      purpose: input.purpose,
      codeHash,
      expiresAt,
    },
  });

  deps.logger.info({ phone: normalizedPhone }, 'OTP challenge created');
  if (env.NODE_ENV !== 'production') {
    deps.logger.info({ phone: normalizedPhone, code }, 'OTP dev code');
  }

  return { challengeId: challenge.id };
}

export async function otpVerify(deps: Deps, input: OtpVerifyInput): Promise<TokenPair> {
  const now = new Date();

  const incrementResult = await deps.db.otpChallenge.updateMany({
    where: {
      id: input.challengeId,
      consumedAt: null,
      attempts: { lt: env.OTP_MAX_ATTEMPTS },
      expiresAt: { gt: now },
    },
    data: {
      attempts: { increment: 1 },
    },
  });

  if (incrementResult.count === 0) {
    throw new AuthError(ERROR_CODES.AUTH_OTP_INVALID, 'Invalid OTP challenge');
  }

  const challenge = await deps.db.otpChallenge.findUnique({
    where: { id: input.challengeId },
  });

  if (!challenge) {
    throw new AuthError(ERROR_CODES.AUTH_OTP_INVALID, 'Invalid OTP challenge');
  }

  const valid = await bcrypt.compare(input.code, challenge.codeHash);
  if (!valid) {
    throw new AuthError(ERROR_CODES.AUTH_OTP_INVALID, 'Invalid OTP code');
  }

  await deps.db.otpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  let user = await deps.db.user.findUnique({ where: { phone: challenge.phone } });
  if (!user) {
    user = await deps.db.user.create({
      data: {
        phone: challenge.phone,
        fullName: input.fullName?.trim() || challenge.phone,
      },
    });
  }

  if (!user.isActive) {
    throw new AuthError(ERROR_CODES.AUTH_FORBIDDEN, 'User is inactive');
  }

  const family = generateFamily();
  const refreshToken = await createRefreshToken(deps, user.id, family);
  return buildTokenPair(user, refreshToken);
}

export async function refresh(
  deps: Deps,
  input: { refreshToken: string },
): Promise<TokenPair> {
  const tokenHash = hashToken(input.refreshToken);

  const token = await deps.db.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!token) {
    throw new AuthError(ERROR_CODES.AUTH_TOKEN_INVALID, 'Invalid refresh token');
  }

  if (token.isRevoked) {
    await deps.db.refreshToken.updateMany({
      where: { family: token.family },
      data: { isRevoked: true },
    });
    throw new AuthError(ERROR_CODES.AUTH_TOKEN_REVOKED, 'Refresh token revoked');
  }

  if (token.expiresAt < new Date()) {
    throw new AuthError(ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Refresh token expired');
  }

  if (!token.user.isActive) {
    throw new AuthError(ERROR_CODES.AUTH_FORBIDDEN, 'User is inactive');
  }

  const newRaw = generateRefreshToken();
  const newHash = hashToken(newRaw);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await deps.db.$transaction(async (tx) => {
    const replacement = await tx.refreshToken.create({
      data: {
        userId: token.userId,
        tokenHash: newHash,
        family: token.family,
        expiresAt,
      },
    });

    await tx.refreshToken.update({
      where: { id: token.id },
      data: {
        isRevoked: true,
        replacedBy: replacement.id,
      },
    });
  });

  return buildTokenPair(token.user, newRaw);
}

export async function logout(
  deps: Deps,
  userId: string,
  refreshToken: string,
): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const token = await deps.db.refreshToken.findUnique({ where: { tokenHash } });

  if (!token || token.userId !== userId) {
    return;
  }

  await deps.db.refreshToken.updateMany({
    where: { family: token.family },
    data: { isRevoked: true },
  });
}

export async function logoutAll(deps: Deps, userId: string): Promise<void> {
  await deps.db.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}
