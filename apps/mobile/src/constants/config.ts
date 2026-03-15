const PROD_API_URL = 'https://bab-lma-production.up.railway.app';
const devHost = '127.0.0.1';

function normalizeBaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return undefined;
  }

  // Keep backward compatibility with legacy env values like ".../v1".
  return trimmed.replace(/\/+$/, '').replace(/\/v1$/, '');
}

const runtimeApiUrl =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL) ??
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

const runtimeSocketUrl =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_SOCKET_URL) ??
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);

export const API_URL = runtimeApiUrl ?? (__DEV__ ? `http://${devHost}:3000` : PROD_API_URL);

export const SOCKET_URL = runtimeSocketUrl ?? (__DEV__ ? `http://${devHost}:3000` : PROD_API_URL);

export const REQUEST_TIMEOUT_MS = 15_000;
export const POLL_INTERVAL_MS = 5_000;
