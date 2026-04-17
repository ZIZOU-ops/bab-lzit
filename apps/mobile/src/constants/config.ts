import { NativeModules } from 'react-native';

const PROD_API_URL = 'https://bab-lzit-production.up.railway.app';

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

function resolveDevHost() {
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  const match = scriptURL?.match(/^https?:\/\/([^/:]+)/);
  return match?.[1] ?? '127.0.0.1';
}

const devHost = resolveDevHost();

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
