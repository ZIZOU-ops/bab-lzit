import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'babloo_access_token';
const REFRESH_TOKEN_KEY = 'babloo_refresh_token';
const LOCALE_KEY = 'babloo_locale';

async function getItem(key: string) {
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string) {
  await SecureStore.deleteItemAsync(key);
}

export async function getStoredAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function storeAccessToken(token: string) {
  await setItem(ACCESS_TOKEN_KEY, token);
}

export async function storeRefreshToken(token: string) {
  await setItem(REFRESH_TOKEN_KEY, token);
}

export async function clearAccessToken() {
  await deleteItem(ACCESS_TOKEN_KEY);
}

export async function clearRefreshToken() {
  await deleteItem(REFRESH_TOKEN_KEY);
}

export async function clearAuthTokens() {
  await Promise.all([clearAccessToken(), clearRefreshToken()]);
}

export async function getStoredLocale() {
  return getItem(LOCALE_KEY);
}

export async function storeLocale(locale: 'fr' | 'en' | 'ar') {
  await setItem(LOCALE_KEY, locale);
}
