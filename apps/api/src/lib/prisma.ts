import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

export type DbClient =
  | PrismaClient
  | Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
