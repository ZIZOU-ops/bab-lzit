import type { ServiceType } from '@prisma/client';
import { pricingEstimateSchema } from '@babloo/shared';
import { publicProcedure, router } from '../trpc';
import { logProcedure } from '../trpc/middleware/logger';
import { estimatePrice } from '../services/pricing.service';

const loggedProcedure = publicProcedure.use(logProcedure);

export const pricingRouter = router({
  estimate: loggedProcedure.input(pricingEstimateSchema).query(({ input }) => {
    const { serviceType, ...detail } = input;
    return estimatePrice(serviceType as ServiceType, detail);
  }),
});
