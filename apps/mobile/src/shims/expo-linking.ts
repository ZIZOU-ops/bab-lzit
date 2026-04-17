import { useEffect, useState } from 'react';
import {
  Linking as RNLinking,
  type EmitterSubscription,
  type LinkingEventType,
  type LinkingOptions,
  type LinkingSendIntentExtras,
  Platform,
} from 'react-native';

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type ParsedURL = {
  hostname: string | null;
  path: string | null;
  queryParams: Record<string, string>;
  scheme: string | null;
};

type CreateURLOptions = {
  isTripleSlashed?: boolean;
  queryParams?: QueryParams;
  scheme?: string;
};

type URLListener = (event: { url: string }) => void;

const APP_SCHEME = 'babloo';

function getBaseURL() {
  return `${APP_SCHEME}://`;
}

function buildQueryString(queryParams: QueryParams = {}) {
  const entries = Object.entries(queryParams).filter(([, value]) => value != null);
  if (!entries.length) {
    return '';
  }

  return `?${new URLSearchParams(
    Object.fromEntries(entries.map(([key, value]) => [key, String(value)])),
  ).toString()}`;
}

function normalizePath(path?: string) {
  if (!path) {
    return '';
  }

  return path.startsWith('/') ? path.slice(1) : path;
}

export function addEventListener(
  type: LinkingEventType,
  handler: URLListener,
): EmitterSubscription {
  return RNLinking.addEventListener(type, handler);
}

export async function parseInitialURLAsync(): Promise<ParsedURL> {
  const initialURL = await getInitialURL();
  if (!initialURL) {
    return {
      scheme: null,
      hostname: null,
      path: null,
      queryParams: {},
    };
  }

  return parse(initialURL);
}

export async function sendIntent(
  action: string,
  extras?: LinkingSendIntentExtras[],
): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('Linking.sendIntent is only available on Android');
  }

  await RNLinking.sendIntent(action, extras);
}

export async function openSettings(): Promise<void> {
  if (RNLinking.openSettings) {
    await RNLinking.openSettings();
    return;
  }

  await openURL('app-settings:');
}

export async function getInitialURL(): Promise<string | null> {
  return (await RNLinking.getInitialURL()) ?? null;
}

export function getLinkingURL(): string | null {
  return null;
}

export async function openURL(url: string): Promise<void> {
  await RNLinking.openURL(url);
}

export async function canOpenURL(url: string): Promise<boolean> {
  return await RNLinking.canOpenURL(url);
}

export function useURL(): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    void getInitialURL().then(setUrl);

    const subscription = addEventListener('url', (event) => {
      setUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return url;
}

export function useLinkingURL(): string | null {
  return useURL();
}

export function createURL(path = '', options: CreateURLOptions = {}): string {
  const scheme = options.scheme ?? APP_SCHEME;
  const slashPrefix = options.isTripleSlashed ? ':///' : '://';
  const normalizedPath = normalizePath(path);
  const queryString = buildQueryString(options.queryParams);

  return `${scheme}${slashPrefix}${normalizedPath}${queryString}`;
}

export function parse(url: string): ParsedURL {
  try {
    const parsed = new URL(url);
    const queryParams = Object.fromEntries(parsed.searchParams.entries());

    return {
      scheme: parsed.protocol ? parsed.protocol.replace(/:$/, '') : null,
      hostname: parsed.hostname || null,
      path: normalizePath(parsed.pathname) || null,
      queryParams,
    };
  } catch {
    return {
      scheme: null,
      hostname: null,
      path: normalizePath(url) || null,
      queryParams: {},
    };
  }
}

export default {
  addEventListener,
  canOpenURL,
  createURL,
  getInitialURL,
  getLinkingURL,
  openSettings,
  openURL,
  parse,
  parseInitialURLAsync,
  sendIntent,
  useLinkingURL,
  useURL,
};

export type { LinkingOptions };
