import { z } from 'zod';
import type { DemandLevel } from '@babloo/shared/pricing';
import type { ServiceType } from '@prisma/client';
import { pricingEstimateSchema } from '@babloo/shared';
import { publicProcedure, router } from '../trpc';
import { logProcedure } from '../trpc/middleware/logger';
import { estimatePrice } from '../services/pricing.service';

const loggedProcedure = publicProcedure.use(logProcedure);

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export const pricingRouter = router({
  estimate: loggedProcedure.input(pricingEstimateSchema).query(({ input }) => {
    const { serviceType, ...detail } = input;
    return estimatePrice(serviceType as ServiceType, detail);
  }),

  getDemandCalendar: loggedProcedure
    .input(
      z.object({
        fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        days: z.number().int().min(1).max(60).optional().default(30),
      }),
    )
    .query(async ({ input, ctx }) => {
      const from = input.fromDate ? parseDateOnly(input.fromDate) : parseDateOnly(formatDateOnly(new Date()));
      const to = new Date(from);
      to.setUTCDate(to.getUTCDate() + input.days - 1);

      const slots = await ctx.db.demandSlot.findMany({
        where: { date: { gte: from, lte: to } },
        orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
      });

      const calendar: Record<string, Record<string, DemandLevel>> = {};
      for (const slot of slots) {
        const dateKey = formatDateOnly(slot.date);
        if (!calendar[dateKey]) {
          calendar[dateKey] = {};
        }
        calendar[dateKey]![slot.timeSlot] = slot.level as DemandLevel;
      }

      return calendar;
    }),
});
