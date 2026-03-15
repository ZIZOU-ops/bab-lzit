import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createTRPCUntypedClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@babloo/api/src/trpc/router';
import { API_URL } from '../constants/config';
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAccessToken,
  storeRefreshToken,
} from '../lib/storage';
import type { User } from '@babloo/shared';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

type AuthUser = User;

type SignupInput = {
  fullName: string;
  email?: string;
  password?: string;
  phone?: string;
};

type OtpRequestInput = {
  phone: string;
  purpose: 'login' | 'signup' | 'reset';
};

type OtpVerifyInput = {
  challengeId: string;
  code: string;
  fullName?: string;
};

type AuthContextValue = {
  state: AuthState;
  user: AuthUser | null;
  token: string | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  requestOtp: (input: OtpRequestInput) => Promise<{ challengeId: string }>;
  loginWithOtp: (input: OtpVerifyInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

function createClient(accessToken?: string) {
  return createTRPCUntypedClient({
    links: [
      httpBatchLink({
        url: `${API_URL}/trpc`,
        headers() {
          if (!accessToken) {
            return {};
          }
          return { Authorization: `Bearer ${accessToken}` };
        },
      }),
    ],
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const clearSession = useCallback(async () => {
    await clearAuthTokens();
    setToken(null);
    setUser(null);
    setState('unauthenticated');
  }, []);

  const fetchCurrentUser = useCallback(async (accessToken: string) => {
    return createClient(accessToken).query('user.me', undefined) as Promise<AuthUser>;
  }, []);

  const applySession = useCallback(
    async (input: { accessToken: string; refreshToken: string }) => {
      await Promise.all([
        storeAccessToken(input.accessToken),
        storeRefreshToken(input.refreshToken),
      ]);

      const currentUser = await fetchCurrentUser(input.accessToken);
      setToken(input.accessToken);
      setUser(currentUser);
      setState('authenticated');
    },
    [fetchCurrentUser],
  );

  const refreshSession = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        await clearSession();
        return null;
      }

      try {
        const refreshed = (await createClient().mutation('auth.refresh', {
          refreshToken,
        })) as TokenPair;
        await applySession({
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
        });
        return refreshed.accessToken;
      } catch {
        await clearSession();
        return null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    try {
      return await refreshPromise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [applySession, clearSession]);

  const bootstrapSession = useCallback(async () => {
    try {
      const [storedAccessToken, storedRefreshToken] = await Promise.all([
        getStoredAccessToken(),
        getStoredRefreshToken(),
      ]);

      if (!storedRefreshToken) {
        setState('unauthenticated');
        return;
      }

      if (storedAccessToken) {
        try {
          const currentUser = await fetchCurrentUser(storedAccessToken);
          setToken(storedAccessToken);
          setUser(currentUser);
          setState('authenticated');
          return;
        } catch {
          // Token might be expired; fallback to refresh flow.
        }
      }

      const refreshedToken = await refreshSession();
      if (!refreshedToken) {
        setState('unauthenticated');
      }
    } catch {
      // If local secure storage is unavailable, fail open to unauthenticated.
      setState('unauthenticated');
    }
  }, [fetchCurrentUser, refreshSession]);

  useEffect(() => {
    let mounted = true;
    const safetyTimer = setTimeout(() => {
      if (!mounted) {
        return;
      }
      setState((current) => (current === 'loading' ? 'unauthenticated' : current));
    }, 2500);

    void bootstrapSession().finally(() => {
      clearTimeout(safetyTimer);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [bootstrapSession]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const result = (await createClient().mutation('auth.login', input)) as TokenPair;
      await applySession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    },
    [applySession],
  );

  const signup = useCallback(
    async (input: SignupInput) => {
      const result = (await createClient().mutation('auth.signup', input)) as TokenPair;
      await applySession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    },
    [applySession],
  );

  const requestOtp = useCallback(async (input: OtpRequestInput) => {
    return createClient().mutation('auth.otpRequest', input) as Promise<{ challengeId: string }>;
  }, []);

  const loginWithOtp = useCallback(
    async (input: OtpVerifyInput) => {
      const result = (await createClient().mutation('auth.otpVerify', input)) as TokenPair;
      await applySession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken && token) {
      try {
        await createClient(token).mutation('auth.logout', { refreshToken });
      } catch {
        // Best effort logout.
      }
    }
    await clearSession();
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user,
      token,
      login,
      signup,
      requestOtp,
      loginWithOtp,
      logout,
      refreshSession,
    }),
    [state, user, token, login, signup, requestOtp, loginWithOtp, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
