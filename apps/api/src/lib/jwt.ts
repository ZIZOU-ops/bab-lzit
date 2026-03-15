import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { env } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
  locale: string;
  fullName: string;
}

export function issueAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as StringValue,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
