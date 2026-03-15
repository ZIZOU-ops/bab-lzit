import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@babloo/api/src/trpc/router';

export const trpc = createTRPCReact<AppRouter>();
