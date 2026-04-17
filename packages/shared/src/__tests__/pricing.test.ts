import { describe, it, expect } from 'vitest';
import { computeMenagePrice } from '../pricing/menage';
import { computeCuisinePrice } from '../pricing/cuisine';
import { computeChildcarePrice } from '../pricing/childcare';
import { computePrice } from '../pricing';
import { ServiceType } from '../types/enums';

describe('Ménage pricing', () => {
  it('40m² solo simple uses labor floor = 120 MAD', () => {
    const result = computeMenagePrice({
      surface: 40,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(120);
    expect(result.ceiling).toBe(300);
  });

  it('100m² solo simple = 135 MAD', () => {
    const result = computeMenagePrice({
      surface: 100,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(135);
    expect(result.ceiling).toBe(338);
  });

  it('200m² duo simple = 250 MAD', () => {
    const result = computeMenagePrice({
      surface: 200,
      teamType: 'duo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(250);
    expect(result.ceiling).toBe(625);
  });

  it('300m² squad(3) simple = 417 MAD', () => {
    const result = computeMenagePrice({
      surface: 300,
      teamType: 'squad',
      cleanType: 'simple',
      squadSize: 3,
    });
    expect(result.floorPrice).toBe(417);
    expect(result.ceiling).toBe(1043);
  });

  it('400m² solo simple = 252 MAD', () => {
    const result = computeMenagePrice({
      surface: 400,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(252);
    expect(result.ceiling).toBe(630);
  });

  it('100m² solo deep = 243 MAD', () => {
    const result = computeMenagePrice({
      surface: 100,
      teamType: 'solo',
      cleanType: 'deep',
    });
    expect(result.floorPrice).toBe(243);
    expect(result.ceiling).toBe(608);
  });

  it('200m² duo deep = 350 MAD', () => {
    const result = computeMenagePrice({
      surface: 200,
      teamType: 'duo',
      cleanType: 'deep',
    });
    expect(result.floorPrice).toBe(350);
    expect(result.ceiling).toBe(875);
  });

  it('300m² squad(3) deep = 530 MAD', () => {
    const result = computeMenagePrice({
      surface: 300,
      teamType: 'squad',
      cleanType: 'deep',
      squadSize: 3,
    });
    expect(result.floorPrice).toBe(530);
    expect(result.ceiling).toBe(1325);
  });

  it('400m² villa solo simple = 328 MAD', () => {
    const result = computeMenagePrice({
      surface: 400,
      teamType: 'solo',
      cleanType: 'simple',
      propertyType: 'villa',
    });
    expect(result.floorPrice).toBe(328);
    expect(result.ceiling).toBe(820);
  });

  it('400m² villa squad(3) simple = 616 MAD', () => {
    const result = computeMenagePrice({
      surface: 400,
      teamType: 'squad',
      cleanType: 'simple',
      squadSize: 3,
      propertyType: 'villa',
    });
    expect(result.floorPrice).toBe(616);
    expect(result.ceiling).toBe(1540);
  });

  it('120m² villa solo simple with 2 floors = 220 MAD', () => {
    const result = computeMenagePrice({
      surface: 120,
      teamType: 'solo',
      cleanType: 'simple',
      propertyType: 'villa',
      floors: 2,
    });
    expect(result.floorPrice).toBe(220);
    expect(result.ceiling).toBe(550);
  });

  it('500m² squad(5) simple includes extra member surcharge = 684 MAD', () => {
    const result = computeMenagePrice({
      surface: 500,
      teamType: 'squad',
      cleanType: 'simple',
      squadSize: 5,
    });
    expect(result.floorPrice).toBe(684);
    expect(result.ceiling).toBe(1710);
  });

  // Ceiling
  it('ceiling = round(floorPrice * 2.5)', () => {
    const result = computeMenagePrice({
      surface: 100,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.ceiling).toBe(Math.round(result.floorPrice * 2.5));
  });

  // Duration estimates
  it('returns duration range', () => {
    const result = computeMenagePrice({
      surface: 80,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.durationMinutes.min).toBeGreaterThan(0);
    expect(result.durationMinutes.max).toBeGreaterThan(
      result.durationMinutes.min,
    );
  });
});

describe('Cuisine pricing', () => {
  it('1 guest = 200 MAD', () => {
    expect(computeCuisinePrice({ guests: 1 }).floorPrice).toBe(200);
  });

  it('4 guests = 200 MAD floor and 500 MAD ceiling', () => {
    const result = computeCuisinePrice({ guests: 4 });
    expect(result.floorPrice).toBe(200);
    expect(result.ceiling).toBe(500);
    expect(result.durationMinutes).toEqual({ min: 90, max: 120 });
  });

  it('5 guests = 280 MAD', () => {
    expect(computeCuisinePrice({ guests: 5 }).floorPrice).toBe(280);
  });

  it('6 guests = 280 MAD floor and 700 MAD ceiling', () => {
    const result = computeCuisinePrice({ guests: 6 });
    expect(result.floorPrice).toBe(280);
    expect(result.ceiling).toBe(700);
    expect(result.durationMinutes).toEqual({ min: 120, max: 180 });
  });

  it('7 guests = 280 MAD', () => {
    expect(computeCuisinePrice({ guests: 7 }).floorPrice).toBe(280);
  });

  it('8 guests = 380 MAD floor and 950 MAD ceiling', () => {
    const result = computeCuisinePrice({ guests: 8 });
    expect(result.floorPrice).toBe(380);
    expect(result.ceiling).toBe(950);
  });

  it('10 guests = 380 MAD', () => {
    const result = computeCuisinePrice({ guests: 10 });
    expect(result.floorPrice).toBe(380);
    expect(result.durationMinutes).toEqual({ min: 180, max: 240 });
  });

  it('11 guests = 380 + ceil(1/3)*50 = 430 MAD', () => {
    expect(computeCuisinePrice({ guests: 11 }).floorPrice).toBe(430);
  });

  it('12 guests = 430 MAD floor and 1075 MAD ceiling', () => {
    const result = computeCuisinePrice({ guests: 12 });
    expect(result.floorPrice).toBe(430);
    expect(result.ceiling).toBe(1075);
  });

  it('13 guests = 380 + ceil(3/3)*50 = 430 MAD', () => {
    expect(computeCuisinePrice({ guests: 13 }).floorPrice).toBe(430);
  });

  it('14 guests = 380 + ceil(4/3)*50 = 480 MAD', () => {
    const result = computeCuisinePrice({ guests: 14 });
    expect(result.floorPrice).toBe(480);
    expect(result.durationMinutes).toEqual({ min: 240, max: 300 });
  });

  it('20 guests = 580 MAD floor and 1450 MAD ceiling', () => {
    const result = computeCuisinePrice({ guests: 20 });
    expect(result.floorPrice).toBe(580);
    expect(result.ceiling).toBe(1450);
    expect(result.durationMinutes).toEqual({ min: 300, max: 420 });
  });

  it('6 guests reception = 420 MAD floor and 1050 MAD ceiling', () => {
    const result = computeCuisinePrice({ guests: 6, mealType: 'reception' });
    expect(result.floorPrice).toBe(420);
    expect(result.ceiling).toBe(1050);
    expect(result.durationMinutes).toEqual({ min: 120, max: 180 });
  });
});

describe('Childcare pricing', () => {
  it('1 child, 1 hour = 80 MAD', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 1 }).floorPrice,
    ).toBe(80);
  });

  it('1 child, 2 hours = 80 MAD (no extra for first 2h)', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 2 }).floorPrice,
    ).toBe(80);
  });

  it('1 child, 3 hours = 80 + 1*1*25 = 105 MAD', () => {
    expect(
      computeChildcarePrice({ children: 1, hours: 3 }).floorPrice,
    ).toBe(105);
  });

  it('2 children, 4 hours = 2*80 + 2*2*25 = 260 MAD', () => {
    expect(
      computeChildcarePrice({ children: 2, hours: 4 }).floorPrice,
    ).toBe(260);
  });

  it('6 children, 12 hours = 6*80 + 6*10*25 = 1980 MAD', () => {
    expect(
      computeChildcarePrice({ children: 6, hours: 12 }).floorPrice,
    ).toBe(1980);
  });
});

describe('computePrice dispatcher', () => {
  it('dispatches menage', () => {
    const result = computePrice(ServiceType.MENAGE, {
      surface: 40,
      teamType: 'solo',
      cleanType: 'simple',
    });
    expect(result.floorPrice).toBe(120);
  });

  it('dispatches cuisine', () => {
    const result = computePrice(ServiceType.CUISINE, { guests: 4 });
    expect(result.floorPrice).toBe(200);
  });

  it('dispatches childcare', () => {
    const result = computePrice(ServiceType.CHILDCARE, {
      children: 1,
      hours: 1,
    });
    expect(result.floorPrice).toBe(80);
  });
});
