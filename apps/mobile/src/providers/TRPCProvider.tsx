import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@babloo/api/src/trpc/router';
import { API_URL } from '../constants/config';
import { trpc } from '../lib/trpc';
import { useAuth } from './AuthProvider';

function isUnauthorized(error: unknown) {
  if (!(error instanceof TRPCClientError)) {
    return false;
  }

  const status = (error.data as { httpStatus?: number } | undefined)?.httpStatus;
  return status === 401;
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const { token, refreshSession } = useAuth();
  const tokenRef = useRef(token);
  const refreshRef = useRef(refreshSession);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError(error) {
            if (isUnauthorized(error)) {
              void refreshRef.current();
            }
          },
        }),
        mutationCache: new MutationCache({
          onError(error) {
            if (isUnauthorized(error)) {
              void refreshRef.current();
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
          headers() {
            const currentToken = tokenRef.current;
            if (!currentToken) {
              return {};
            }
            return {
              Authorization: `Bearer ${currentToken}`,
            };
          },
        }),
      ],
    }),
  );

  useEffect(() => {
    const previous = tokenRef.current;
    tokenRef.current = token;

    // Invalidate all cached queries on auth transitions (login/logout)
    // so hooks re-fetch with the new (or absent) Authorization header.
    if (Boolean(previous) !== Boolean(token)) {
      void queryClient.invalidateQueries();
    }
  }, [token, queryClient]);

  useEffect(() => {
    refreshRef.current = refreshSession;
  }, [refreshSession]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
