import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { UserRole } from '@prisma/client';
import { db } from '../src/lib/prisma';
import { redis } from '../src/lib/redis';
import { logger } from '../src/lib/logger';
import { appRouter } from '../src/trpc/router';

export async function resetDatabase() {
  await db.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
}

export function mockContext(user?: { id: string; role: string } | null) {
  return {
    db,
    redis,
    user: user ?? null,
    requestId: randomUUID(),
    logger,
  };
}

export function createTestCaller(user?: { id: string; role: string } | null) {
  return appRouter.createCaller(mockContext(user));
}

export async function createTestUser(overrides?: {
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  fullName?: string;
}) {
  const email = overrides?.email ?? `user-${randomUUID()}@babloo.test`;
  const password = overrides?.password ?? 'Password123!';
  const passwordHash = await bcrypt.hash(password, 4);

  const user = await db.user.create({
    data: {
      email,
      phone: overrides?.phone ?? null,
      passwordHash,
      fullName: overrides?.fullName ?? 'Test User',
      role: overrides?.role ?? 'client',
    },
  });

  return {
    user,
    password,
  };
}
