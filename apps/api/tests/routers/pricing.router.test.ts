import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../src/lib/prisma';
import { redis } from '../../src/lib/redis';
import { createTestCaller, resetDatabase } from '../helpers';

describe('pricing.router', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await redis.quit();
    await db.$disconnect();
  });

  it('estimate menage returns floor and ceiling price', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 70,
      cleanType: 'simple',
      teamType: 'duo',
    });

    expect(result.floorPrice).toBe(140);
    expect(result.ceilingPrice).toBeGreaterThanOrEqual(result.floorPrice);
  });

  it('estimate cuisine with 5 guests returns expected floor', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'cuisine',
      guests: 5,
    });

    expect(result.floorPrice).toBe(130);
  });
});
