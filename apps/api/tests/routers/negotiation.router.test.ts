import { randomUUID } from 'node:crypto';
import { ERROR_CODES } from '@babloo/shared/errors';
import type { ServiceType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
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

  await db.professional.create({
    data: {
      userId: user.id,
      skills: [serviceType],
      zones: [zone],
      isAvailable: true,
      isTeamLead: true,
    },
  });

  return user;
}

async function setupNegotiatingOrder() {
  const { user: client } = await createTestUser({
    email: `client-${randomUUID()}@babloo.test`,
    role: 'client',
  });
  const pro = await createProFor('menage', 'casablanca');

  const clientCaller = createTestCaller({ id: client.id, role: 'client' });

  const order = await clientCaller.order.create({
    serviceType: 'menage',
    location: 'Casablanca',
    detail: {
      serviceType: 'menage',
      surface: 200,
      cleanType: 'simple',
      teamType: 'duo',
    },
  });

  expect(order.status).toBe('negotiating');

  const proCaller = createTestCaller({ id: pro.id, role: 'pro' });

  return { order, client, pro, clientCaller, proCaller };
}

describe('negotiation.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('send message with correct seq', async () => {
    const { order, clientCaller } = await setupNegotiatingOrder();

    const message = await clientCaller.negotiation.sendMessage({
      orderId: order.id,
      content: 'Bonjour',
      clientMessageId: randomUUID(),
    });

    expect(message.seq).toBeGreaterThan(0);
  });

  it('duplicate clientMessageId is idempotent', async () => {
    const { order, clientCaller } = await setupNegotiatingOrder();
    const clientMessageId = randomUUID();

    const first = await clientCaller.negotiation.sendMessage({
      orderId: order.id,
      content: 'Message unique',
      clientMessageId,
    });

    const duplicate = await clientCaller.negotiation.sendMessage({
      orderId: order.id,
      content: 'Message duplicate',
      clientMessageId,
    });

    expect(duplicate.id).toBe(first.id);
  });

  it('message in non-negotiating order fails', async () => {
    const { user: client } = await createTestUser({ role: 'client' });
    const clientCaller = createTestCaller({ id: client.id, role: 'client' });

    const order = await clientCaller.order.create({
      serviceType: 'cuisine',
      location: 'Rabat',
      detail: {
        serviceType: 'cuisine',
        guests: 4,
      },
    });

    await expect(
      clientCaller.negotiation.sendMessage({
        orderId: order.id,
        content: 'Test',
        clientMessageId: randomUUID(),
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
    } satisfies Partial<TRPCError>);
  });

  it('create offer in bounds succeeds', async () => {
    const { order, proCaller } = await setupNegotiatingOrder();

    const offer = await proCaller.negotiation.createOffer({
      orderId: order.id,
      amount: 255,
    });

    expect(offer.amount).toBe(255);
  });

  it('pro can offer at floor x 0.9', async () => {
    const { order, proCaller } = await setupNegotiatingOrder();
    const discountedFloor = Math.round(order.floorPrice * 0.9);

    expect(order.floorPrice).toBe(250);
    expect(discountedFloor).toBe(225);

    const offer = await proCaller.negotiation.createOffer({
      orderId: order.id,
      amount: discountedFloor,
    });

    expect(offer.amount).toBe(discountedFloor);
  });

  it('pro cannot offer below floor x 0.9', async () => {
    const { order, proCaller } = await setupNegotiatingOrder();
    const discountedFloor = Math.round(order.floorPrice * 0.9);

    try {
      await proCaller.negotiation.createOffer({
        orderId: order.id,
        amount: discountedFloor - 5,
      });
      throw new Error('Expected amount out of bounds');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('BAD_REQUEST');
      expect(extractAppCode(error)).toBe(ERROR_CODES.NEG_AMOUNT_OUT_OF_BOUNDS);
    }
  });

  it('client cannot offer below floor', async () => {
    const { order, clientCaller } = await setupNegotiatingOrder();

    try {
      await clientCaller.negotiation.createOffer({
        orderId: order.id,
        amount: order.floorPrice - 5,
      });
      throw new Error('Expected amount out of bounds');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('BAD_REQUEST');
      expect(extractAppCode(error)).toBe(ERROR_CODES.NEG_AMOUNT_OUT_OF_BOUNDS);
    }
  });

  it('client can offer exactly at floor', async () => {
    const { order, clientCaller } = await setupNegotiatingOrder();

    const offer = await clientCaller.negotiation.createOffer({
      orderId: order.id,
      amount: order.floorPrice,
    });

    expect(offer.amount).toBe(order.floorPrice);
  });

  it('create offer outside bounds fails (NEG_204)', async () => {
    const { order, proCaller } = await setupNegotiatingOrder();

    try {
      await proCaller.negotiation.createOffer({
        orderId: order.id,
        amount: 10000,
      });
      throw new Error('Expected amount out of bounds');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('BAD_REQUEST');
      expect(extractAppCode(error)).toBe(ERROR_CODES.NEG_AMOUNT_OUT_OF_BOUNDS);
    }
  });

  it('non-multiple-of-5 fails (NEG_205)', async () => {
    const { order, proCaller } = await setupNegotiatingOrder();

    try {
      await proCaller.negotiation.createOffer({
        orderId: order.id,
        amount: 251,
      });
      throw new Error('Expected bad increment');
    } catch (error) {
      const trpcError = error as TRPCError;
      expect(trpcError.code).toBe('BAD_REQUEST');
      expect(extractAppCode(error)).toBe(ERROR_CODES.NEG_AMOUNT_BAD_INCREMENT);
    }
  });

  it('accept offer sets finalPrice', async () => {
    const { order, clientCaller, proCaller } = await setupNegotiatingOrder();

    const offer = await proCaller.negotiation.createOffer({
      orderId: order.id,
      amount: 260,
    });

    const accepted = await clientCaller.negotiation.acceptOffer({
      orderId: order.id,
      offerId: offer.id,
    });

    expect(accepted.finalPrice).toBe(260);

    const refreshedOrder = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(refreshedOrder.finalPrice).toBe(260);
  });

  it('accept own offer fails', async () => {
    const { order, clientCaller } = await setupNegotiatingOrder();

    const ownOffer = await clientCaller.negotiation.createOffer({
      orderId: order.id,
      amount: order.floorPrice,
    });

    await expect(
      clientCaller.negotiation.acceptOffer({
        orderId: order.id,
        offerId: ownOffer.id,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    } satisfies Partial<TRPCError>);
  });

  it('seq pagination works', async () => {
    const { order, clientCaller } = await setupNegotiatingOrder();

    await clientCaller.negotiation.sendMessage({
      orderId: order.id,
      content: 'M1',
      clientMessageId: randomUUID(),
    });
    const message2 = await clientCaller.negotiation.sendMessage({
      orderId: order.id,
      content: 'M2',
      clientMessageId: randomUUID(),
    });

    const page = await clientCaller.negotiation.messages({
      orderId: order.id,
      beforeSeq: message2.seq,
      limit: 10,
    });

    expect(page.some((m) => m.content === 'M1')).toBe(true);
    expect(page.some((m) => m.content === 'M2')).toBe(false);
  });

  it('poll returns items after given seq', async () => {
    const { order, clientCaller, proCaller } = await setupNegotiatingOrder();

    const message = await clientCaller.negotiation.sendMessage({
      orderId: order.id,
      content: 'Initial',
      clientMessageId: randomUUID(),
    });

    await proCaller.negotiation.createOffer({
      orderId: order.id,
      amount: 255,
    });

    const poll = await clientCaller.negotiation.poll({
      orderId: order.id,
      afterSeq: message.seq,
    });

    expect(poll.offers.length).toBeGreaterThan(0);
    expect(poll.lastSeq).toBeGreaterThan(message.seq);
  });
});
