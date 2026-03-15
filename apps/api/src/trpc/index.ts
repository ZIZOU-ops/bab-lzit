import {
  mergeRouters,
  middleware,
  publicProcedure,
  router,
  t,
} from './core';
import { isAuthenticated } from './middleware/auth';
import { logProcedure } from './middleware/logger';
import { requireRole } from './middleware/role';

export { router, mergeRouters, middleware, publicProcedure, t };
export const protectedProcedure = publicProcedure.use(logProcedure).use(isAuthenticated);
export const adminProcedure = protectedProcedure.use(requireRole('admin'));
export const createCallerFactory = t.createCallerFactory;
