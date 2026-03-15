import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';
import { getStoredLocale, storeLocale } from '../lib/storage';

type Locale = 'fr' | 'en' | 'ar';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>((i18n.language as Locale) ?? 'fr');

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const saved = await getStoredLocale();
      if (!mounted || (saved !== 'fr' && saved !== 'en' && saved !== 'ar')) {
        return;
      }
      await i18n.changeLanguage(saved);
      setLocaleState(saved);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    await i18n.changeLanguage(nextLocale);
    await storeLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
