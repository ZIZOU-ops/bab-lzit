import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/prisma';
import { redis } from '../../src/lib/redis';
import { createTestCaller, createTestUser, resetDatabase } from '../helpers';

async function createProfessional(userId: string, options?: { isTeamLead?: boolean; available?: boolean }) {
  return db.professional.create({
    data: {
      userId,
      skills: ['menage'],
      zones: ['casablanca'],
      isAvailable: options?.available ?? true,
      isTeamLead: options?.isTeamLead ?? false,
    },
  });
}

describe('pro.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('profile returns professional profile', async () => {
    const { user } = await createTestUser({ role: 'pro' });
    await createProfessional(user.id, { isTeamLead: true });

    const caller = createTestCaller({ id: user.id, role: 'pro' });
    const profile = await caller.pro.profile();

    expect(profile.userId).toBe(user.id);
    expect(profile.isTeamLead).toBe(true);
  });

  it('toggleAvailability updates availability', async () => {
    const { user } = await createTestUser({ role: 'pro' });
    await createProfessional(user.id);

    const caller = createTestCaller({ id: user.id, role: 'pro' });

    const updated = await caller.pro.toggleAvailability({ available: false });
    expect(updated.isAvailable).toBe(false);
  });

  it('getOpenSlots returns accepted team order with space', async () => {
    const { user: leadUser } = await createTestUser({ role: 'pro' });
    const leadPro = await createProfessional(leadUser.id, { isTeamLead: true });

    const { user: targetUser } = await createTestUser({ role: 'pro' });
    await createProfessional(targetUser.id, { available: true });

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

    await db.orderDetail.create({
      data: {
        orderId: order.id,
        surface: 80,
        cleanType: 'simple',
        teamType: 'duo',
      },
    });

    await db.orderAssignment.create({
      data: {
        orderId: order.id,
        professionalId: leadPro.id,
        isLead: true,
        status: 'confirmed',
      },
    });

    const caller = createTestCaller({ id: targetUser.id, role: 'pro' });
    const openSlots = await caller.pro.openSlots();

    expect(openSlots.length).toBe(1);
    expect(openSlots[0].id).toBe(order.id);
  });

  it('createJoinRequest + lead approve', async () => {
    const { user: leadUser } = await createTestUser({ role: 'pro' });
    const leadPro = await createProfessional(leadUser.id, { isTeamLead: true });

    const { user: candidateUser } = await createTestUser({ role: 'pro' });
    await createProfessional(candidateUser.id);

    const { user: client } = await createTestUser({ role: 'client' });

    const order = await db.order.create({
      data: {
        clientId: client.id,
        serviceType: 'menage',
        status: 'accepted',
        floorPrice: 160,
        location: 'Casablanca',
      },
    });

    await db.orderDetail.create({
      data: {
        orderId: order.id,
        surface: 90,
        cleanType: 'simple',
        teamType: 'duo',
      },
    });

    await db.orderAssignment.create({
      data: {
        orderId: order.id,
        professionalId: leadPro.id,
        isLead: true,
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    const candidateCaller = createTestCaller({ id: candidateUser.id, role: 'pro' });
    const assignment = await candidateCaller.pro.createJoinRequest({ orderId: order.id });
    expect(assignment.status).toBe('assigned');

    const leadCaller = createTestCaller({ id: leadUser.id, role: 'pro' });
    const pending = await leadCaller.pro.joinRequests({ orderId: order.id });
    expect(pending.pending.length).toBe(1);

    const approved = await leadCaller.pro.approveAssignment({ assignmentId: assignment.id });
    expect(approved.status).toBe('confirmed');
  });

  it('assigned pro can decline own assignment', async () => {
    const { user: proUser } = await createTestUser({ role: 'pro' });
    const pro = await createProfessional(proUser.id);
    const { user: client } = await createTestUser({ role: 'client' });

    const order = await db.order.create({
      data: {
        clientId: client.id,
        serviceType: 'menage',
        status: 'accepted',
        floorPrice: 120,
        location: 'Casablanca',
      },
    });

    const assignment = await db.orderAssignment.create({
      data: {
        orderId: order.id,
        professionalId: pro.id,
        status: 'assigned',
        isLead: false,
      },
    });

    const caller = createTestCaller({ id: proUser.id, role: 'pro' });
    const declined = await caller.pro.declineAssignment({ assignmentId: assignment.id });

    expect(declined.status).toBe('declined');
  });
});
