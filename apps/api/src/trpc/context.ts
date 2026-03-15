import crypto from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { Logger } from 'pino';
import { db } from '../lib/prisma';
import { redis } from '../lib/redis';
import { createChildLogger } from '../lib/logger';
import { verifyAccessToken } from '../lib/jwt';

export interface TrpcUser {
  id: string;
  role: string;
}

export interface TrpcContext {
  db: typeof db;
  redis: typeof redis;
  user: TrpcUser | null;
  requestId: string;
  logger: Logger;
}

function extractBearerToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (!auth) {
    return null;
  }

  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

export async function createContext({
  req,
}: {
  req: FastifyRequest;
}): Promise<TrpcContext> {
  const requestId = crypto.randomUUID();
  const logger = createChildLogger({ requestId, scope: 'trpc' });
  const token = extractBearerToken(req);

  let user: TrpcUser | null = null;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      user = { id: payload.userId, role: payload.role };
    } catch {
      user = null;
    }
  }

  return {
    db,
    redis,
    user,
    requestId,
    logger,
  };
}

export type Context = TrpcContext;
