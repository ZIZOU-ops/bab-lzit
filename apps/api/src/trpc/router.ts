import { adminRouter } from '../routers/admin.router';
import { authRouter } from '../routers/auth.router';
import { negotiationRouter } from '../routers/negotiation.router';
import { orderRouter } from '../routers/order.router';
import { pricingRouter } from '../routers/pricing.router';
import { proRouter } from '../routers/pro.router';
import { userRouter } from '../routers/user.router';
import { router } from './index';

export const appRouter = router({
  auth: authRouter,
  order: orderRouter,
  pricing: pricingRouter,
  negotiation: negotiationRouter,
  pro: proRouter,
  admin: adminRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
