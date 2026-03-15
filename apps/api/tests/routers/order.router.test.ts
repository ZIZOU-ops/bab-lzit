import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { ERROR_CODES } from '@babloo/shared/errors';
import type { ServiceType } from '@prisma/client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/prisma';
import { redis } from '../../src/lib/redis';
import { createTestCaller, createTestUser, resetDatabase } from '../helpers';

function extractAppCode(error: unknown): string | null {
  const e = error as {
    shape?: { data?: { appCode?: string | null } };
    cause?: { code?: string };
    data?: { appCode?: string | null };
  };
  return e.shape?.data?.appCode ?? e.data?.appCode ?? e.cause?.code ?? null;
}

async function createProFor(serviceType: ServiceType, zone: string) {
  const { user } = await createTestUser({
    email: `pro-${randomUUID()}@babloo.test`,
    role: 'pro',
  });

  const pro = await db.professional.create({
    data: {
      userId: user.id,
      skills: [serviceType],
      zones: [zone],
      isAvailable: true,
      isTeamLead: true,
      reliability: 98,
      rating: 4.9,
    },
  });

  return { user, pro };
}

describe('order.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('create menage order calculates correct floor price', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const order = await caller.order.create({
      serviceType: 'menage',
      location: 'Casablanca Maarif',
      detail: {
        serviceType: 'menage',
        surface: 40,
        cleanType: 'simple',
        teamType: 'solo',
      },
    });

    expect(order.floorPrice).toBe(80);
  });

  it('create cuisine order with 5 guests = correct price', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const order = await caller.order.create({
      serviceType: 'cuisine',
      location: 'Rabat Agdal',
      detail: {
        serviceType: 'cuisine',
        guests: 5,
      },
    });

    expect(order.floorPrice).toBe(130);
  });

  it('list orders returns paginated results with correct cursor', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    for (let i = 0; i < 3; i += 1) {
      await caller.order.create({
        serviceType: 'cuisine',
        location: `Rabat ${i}`,
        detail: {
          serviceType: 'cuisine',
          guests: 4,
        },
      });
    }

    const firstPage = await caller.order.list({ limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await caller.order.list({
      limit: 2,
      cursor: firstPage.nextCursor ?? undefined,
    });

    expect(secondPage.items.length).toBeGreaterThanOrEqual(1);
  });

  it('get order by id returns detail', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const created = await caller.order.create({
      serviceType: 'childcare',
      location: 'Casablanca',
      detail: {
        serviceType: 'childcare',
        children: 2,
        hours: 3,
      },
    });

    const found = await caller.order.byId({ orderId: created.id });
    expect(found.detail).toBeTruthy();
  });

  it('cancel order transitions to CANCELLED', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const created = await caller.order.create({
      serviceType: 'cuisine',
      location: 'Temara',
      detail: {
        serviceType: 'cuisine',
        guests: 4,
      },
    });

    const cancelled = await caller.order.cancel({ orderId: created.id });
    expect(cancelled.status).toBe('cancelled');
  });

  it('cancel completed order fails with ORDER_101', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const created = await caller.order.create({
      serviceType: 'childcare',
      location: 'Casablanca',
      detail: {
        serviceType: 'childcare',
        children: 1,
        hours: 2,
      },
    });

    await db.order.update({
      where: { id: created.id },
      data: { status: 'completed' },
    });

    try {
      await caller.order.cancel({ orderId: created.id });
      throw new Error('Expected cancel to fail');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('CONFLICT');
      expect(extractAppCode(error)).toBe(ERROR_CODES.ORDER_INVALID_TRANSITION);
    }
  });

  it('rate completed order succeeds', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const created = await caller.order.create({
      serviceType: 'cuisine',
      location: 'Sale',
      detail: {
        serviceType: 'cuisine',
        guests: 4,
      },
    });

    await db.order.update({
      where: { id: created.id },
      data: { status: 'completed' },
    });

    const rating = await caller.order.rate({
      orderId: created.id,
      stars: 5,
      comment: 'Excellent service',
    });

    expect(rating.stars).toBe(5);
  });

  it('rate order twice fails (conflict)', async () => {
    const { user } = await createTestUser();
    const caller = createTestCaller({ id: user.id, role: 'client' });

    const created = await caller.order.create({
      serviceType: 'cuisine',
      location: 'Sale',
      detail: {
        serviceType: 'cuisine',
        guests: 4,
      },
    });

    await db.order.update({
      where: { id: created.id },
      data: { status: 'completed' },
    });

    await caller.order.rate({
      orderId: created.id,
      stars: 4,
    });

    await expect(
      caller.order.rate({
        orderId: created.id,
        stars: 5,
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<TRPCError>);
  });

  it('pro updates status through valid transitions', async () => {
    const { user: client } = await createTestUser({
      email: `client-${randomUUID()}@babloo.test`,
      role: 'client',
    });
    const { user: proUser } = await createProFor('menage', 'casablanca');

    const clientCaller = createTestCaller({ id: client.id, role: 'client' });

    const created = await clientCaller.order.create({
      serviceType: 'menage',
      location: 'Casablanca',
      detail: {
        serviceType: 'menage',
        surface: 70,
        cleanType: 'simple',
        teamType: 'duo',
      },
    });

    expect(created.status).toBe('negotiating');

    const proCaller = createTestCaller({ id: proUser.id, role: 'pro' });

    const accepted = await proCaller.order.updateStatus({
      orderId: created.id,
      status: 'accepted',
    });
    expect(accepted.status).toBe('accepted');

    const enRoute = await proCaller.order.updateStatus({
      orderId: created.id,
      status: 'en_route',
    });
    expect(enRoute.status).toBe('en_route');
  });

  it('pro cannot skip statuses', async () => {
    const { user: client } = await createTestUser({
      email: `client-${randomUUID()}@babloo.test`,
      role: 'client',
    });
    const { user: proUser } = await createProFor('menage', 'casablanca');

    const clientCaller = createTestCaller({ id: client.id, role: 'client' });

    const created = await clientCaller.order.create({
      serviceType: 'menage',
      location: 'Casablanca',
      detail: {
        serviceType: 'menage',
        surface: 70,
        cleanType: 'simple',
        teamType: 'duo',
      },
    });

    const proCaller = createTestCaller({ id: proUser.id, role: 'pro' });

    try {
      await proCaller.order.updateStatus({
        orderId: created.id,
        status: 'in_progress',
      });
      throw new Error('Expected transition to fail');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('CONFLICT');
      expect(extractAppCode(error)).toBe(ERROR_CODES.ORDER_INVALID_TRANSITION);
    }
  });
});
