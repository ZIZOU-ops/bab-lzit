import { z } from 'zod';
import { DEMAND_LEVELS, TIME_SLOT_KEYS } from '../../pricing/demand';
import { MEAL_TYPES, PROPERTY_TYPES } from '../../pricing/types';

const propertyTypeSchema = z.enum(PROPERTY_TYPES);
const mealTypeSchema = z.enum(MEAL_TYPES);
const demandLevelSchema = z.enum(DEMAND_LEVELS);
const timeSlotSchema = z.enum(TIME_SLOT_KEYS);
const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createOrderSchema = z.object({
  serviceType: z.enum(['menage', 'cuisine', 'childcare']),
  location: z.string().min(1).max(100),
  neighborhoodId: z.string().optional(),
  scheduledDate: dateOnlySchema.optional(),
  scheduledTimeSlot: timeSlotSchema.optional(),
  demandLevel: demandLevelSchema.optional(),
  scheduledStartAt: z.string().datetime().optional(),
  detail: z.discriminatedUnion('serviceType', [
    z.object({
      serviceType: z.literal('menage'),
      surface: z.number().int().min(20).max(1000),
      cleanType: z.enum(['simple', 'deep']),
      teamType: z.enum(['solo', 'duo', 'squad']),
      propertyType: propertyTypeSchema.optional().default('apartment'),
      floors: z.number().int().min(1).max(3).optional().default(1),
      squadSize: z.number().int().min(3).max(5).optional(),
      notes: z.string().max(500).trim().optional(),
    }),
    z.object({
      serviceType: z.literal('cuisine'),
      guests: z.number().int().min(1).max(20),
      mealType: mealTypeSchema.optional().default('daily'),
      dishes: z.string().max(500).trim().optional(),
    }),
    z.object({
      serviceType: z.literal('childcare'),
      children: z.number().int().min(1).max(6),
      hours: z.number().int().min(1).max(12),
      notes: z.string().max(500).trim().optional(),
    }),
  ]),
});

export const cancelOrderSchema = z.object({
  reason: z.string().max(500).trim().optional(),
});

export const updateStatusSchema = z.object({
  toStatus: z.enum([
    'submitted',
    'searching',
    'negotiating',
    'accepted',
    'en_route',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  reason: z.string().max(500).trim().optional(),
});

export const ratingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).trim().optional(),
});

export const pricingEstimateSchema = z.discriminatedUnion('serviceType', [
  z.object({
    serviceType: z.literal('menage'),
    neighborhoodId: z.string().optional(),
    demandLevel: demandLevelSchema.optional(),
    surface: z.number().int().min(20).max(1000),
    cleanType: z.enum(['simple', 'deep']),
    teamType: z.enum(['solo', 'duo', 'squad']),
    propertyType: propertyTypeSchema.optional().default('apartment'),
    floors: z.number().int().min(1).max(3).optional().default(1),
    squadSize: z.number().int().min(3).max(5).optional(),
  }),
  z.object({
    serviceType: z.literal('cuisine'),
    neighborhoodId: z.string().optional(),
    demandLevel: demandLevelSchema.optional(),
    guests: z.number().int().min(1).max(20),
    mealType: mealTypeSchema.optional().default('daily'),
  }),
  z.object({
    serviceType: z.literal('childcare'),
    neighborhoodId: z.string().optional(),
    demandLevel: demandLevelSchema.optional(),
    children: z.number().int().min(1).max(6),
    hours: z.number().int().min(1).max(12),
  }),
]);
