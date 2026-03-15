import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/prisma';
import { redis } from '../../src/lib/redis';
import { createTestCaller, createTestUser, resetDatabase } from '../helpers';

describe('user.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('me returns current user', async () => {
    const { user } = await createTestUser({ email: 'me@babloo.test' });
    const caller = createTestCaller({ id: user.id, role: user.role });

    const me = await caller.user.me();
    expect(me.id).toBe(user.id);
    expect(me.email).toBe('me@babloo.test');
  });

  it('updateProfile updates name and locale', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: user.role });

    const updated = await caller.user.updateProfile({
      name: 'Updated User',
      locale: 'en',
      avatar: 'https://example.com/avatar.png',
    });

    expect(updated.fullName).toBe('Updated User');
    expect(updated.locale).toBe('en');
    expect(updated.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('register and unregister push token', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: user.role });

    await caller.user.registerPushToken({
      token: 'ExponentPushToken[test-token]',
    });

    let refreshed = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { pushTokens: true },
    });
    expect(refreshed.pushTokens).toContain('ExponentPushToken[test-token]');

    await caller.user.unregisterPushToken({
      token: 'ExponentPushToken[test-token]',
    });

    refreshed = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { pushTokens: true },
    });

    expect(refreshed.pushTokens).not.toContain('ExponentPushToken[test-token]');
  });
});
