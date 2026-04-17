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

  it('estimate menage 40m² solo simple returns labor floor and ceiling', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 40,
      cleanType: 'simple',
      teamType: 'solo',
    });

    expect(result.floorPrice).toBe(120);
    expect(result.recommendedPrice).toBe(120);
    expect(result.ceilingPrice).toBe(300);
  });

  it('estimate menage 100m² solo simple returns expected floor and ceiling', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 100,
      cleanType: 'simple',
      teamType: 'solo',
    });

    expect(result.floorPrice).toBe(135);
    expect(result.recommendedPrice).toBe(135);
    expect(result.ceilingPrice).toBe(338);
  });

  it('estimate menage 200m² duo simple returns expected floor and ceiling', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 200,
      cleanType: 'simple',
      teamType: 'duo',
    });

    expect(result.floorPrice).toBe(250);
    expect(result.recommendedPrice).toBe(250);
    expect(result.ceilingPrice).toBe(625);
  });

  it('estimate menage 300m² squad simple returns expected floor and ceiling', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 300,
      cleanType: 'simple',
      teamType: 'squad',
      squadSize: 3,
    });

    expect(result.floorPrice).toBe(417);
    expect(result.recommendedPrice).toBe(417);
    expect(result.ceilingPrice).toBe(1043);
  });

  it('estimate menage 100m² solo deep returns expected floor and ceiling', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 100,
      cleanType: 'deep',
      teamType: 'solo',
    });

    expect(result.floorPrice).toBe(243);
    expect(result.recommendedPrice).toBe(243);
    expect(result.ceilingPrice).toBe(608);
  });

  it('estimate menage 200m² duo deep returns expected floor and ceiling', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 200,
      cleanType: 'deep',
      teamType: 'duo',
    });

    expect(result.floorPrice).toBe(350);
    expect(result.recommendedPrice).toBe(350);
    expect(result.ceilingPrice).toBe(875);
  });

  it('estimate menage applies property type server-side', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 400,
      cleanType: 'simple',
      teamType: 'solo',
      propertyType: 'villa',
    });

    expect(result.floorPrice).toBe(328);
    expect(result.recommendedPrice).toBe(328);
    expect(result.ceilingPrice).toBe(820);
  });

  it('estimate menage applies neighborhood multiplier to recommended price', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 100,
      cleanType: 'simple',
      teamType: 'solo',
      neighborhoodId: 'hay_riad',
    });

    expect(result.floorPrice).toBe(135);
    expect(result.recommendedPrice).toBe(162);
    expect(result.ceilingPrice).toBe(338);
  });

  it('estimate menage applies demand multiplier to recommended price', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 100,
      cleanType: 'simple',
      teamType: 'solo',
      demandLevel: 'red',
    });

    expect(result.floorPrice).toBe(135);
    expect(result.recommendedPrice).toBe(162);
    expect(result.ceilingPrice).toBe(338);
  });

  it('estimate menage deep squad uses leader-only deep premium', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'menage',
      surface: 300,
      cleanType: 'deep',
      teamType: 'squad',
      squadSize: 3,
    });

    expect(result.floorPrice).toBe(530);
    expect(result.recommendedPrice).toBe(530);
    expect(result.ceilingPrice).toBe(1325);
  });

  it('estimate cuisine with 5 guests returns expected floor', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'cuisine',
      guests: 5,
    });

    expect(result.floorPrice).toBe(280);
    expect(result.recommendedPrice).toBe(280);
    expect(result.ceilingPrice).toBe(700);
  });

  it('estimate cuisine applies meal type server-side', async () => {
    const caller = createTestCaller();

    const result = await caller.pricing.estimate({
      serviceType: 'cuisine',
      guests: 6,
      mealType: 'reception',
    });

    expect(result.floorPrice).toBe(420);
    expect(result.recommendedPrice).toBe(420);
    expect(result.ceilingPrice).toBe(1050);
  });

  it('getDemandCalendar returns stored slot levels keyed by date', async () => {
    const caller = createTestCaller();

    await db.demandSlot.createMany({
      data: [
        {
          date: new Date('2026-03-28T00:00:00.000Z'),
          timeSlot: 'morning',
          level: 'yellow',
        },
        {
          date: new Date('2026-03-28T00:00:00.000Z'),
          timeSlot: 'evening',
          level: 'red',
        },
      ],
    });

    const calendar = await caller.pricing.getDemandCalendar({
      fromDate: '2026-03-28',
      days: 2,
    });

    expect(calendar['2026-03-28']).toMatchObject({
      morning: 'yellow',
      evening: 'red',
    });
  });
});
