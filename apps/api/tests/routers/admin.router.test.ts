import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/prisma';
import { redis } from '../../src/lib/redis';
import { createTestCaller, createTestUser, resetDatabase } from '../helpers';

describe('admin.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('admin status override bypasses FSM and writes audit log', async () => {
    const { user: admin } = await createTestUser({
      email: `admin-${randomUUID()}@babloo.test`,
      role: 'admin',
    });
    const { user: client } = await createTestUser({ role: 'client' });

    const order = await db.order.create({
      data: {
        clientId: client.id,
        serviceType: 'cuisine',
        status: 'draft',
        floorPrice: 100,
        location: 'Rabat',
      },
    });

    const caller = createTestCaller({ id: admin.id, role: 'admin' });

    const updated = await caller.admin.overrideStatus({
      orderId: order.id,
      toStatus: 'completed',
      reason: 'manual override',
    });

    expect(updated.status).toBe('completed');

    const audit = await db.auditLog.findFirst({
      where: { entityId: order.id, action: 'order.status.override' },
    });
    expect(audit).toBeTruthy();
  });

  it('admin price override updates finalPrice and writes audit log', async () => {
    const { user: admin } = await createTestUser({ role: 'admin' });
    const { user: client } = await createTestUser({ role: 'client' });

    const order = await db.order.create({
      data: {
        clientId: client.id,
        serviceType: 'menage',
        status: 'accepted',
        floorPrice: 150,
        location: 'Casablanca',
      },
    });

    const caller = createTestCaller({ id: admin.id, role: 'admin' });
    const updated = await caller.admin.overridePrice({
      orderId: order.id,
      finalPrice: 220,
      reason: 'manual adjustment',
    });

    expect(updated.finalPrice).toBe(220);

    const audit = await db.auditLog.findFirst({
      where: { entityId: order.id, action: 'order.price.override' },
    });
    expect(audit).toBeTruthy();
  });

  it('admin can toggle user active', async () => {
    const { user: admin } = await createTestUser({ role: 'admin' });
    const { user: client } = await createTestUser({ role: 'client' });

    const caller = createTestCaller({ id: admin.id, role: 'admin' });

    const updated = await caller.admin.toggleUser({
      userId: client.id,
      isActive: false,
    });

    expect(updated.isActive).toBe(false);
  });
});
