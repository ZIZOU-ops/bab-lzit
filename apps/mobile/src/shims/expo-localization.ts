import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';

type Locale = {
  currencyCode: string | null;
  currencySymbol: string | null;
  decimalSeparator: string;
  digitGroupingSeparator: string;
  languageCode: string;
  languageTag: string;
  measurementSystem: 'metric' | 'us' | 'uk';
  regionCode: string | null;
  temperatureUnit: 'celsius' | 'fahrenheit';
  textDirection: 'ltr' | 'rtl';
};

type Calendar = {
  calendar: string;
  firstWeekday: number;
  timeZone: string;
  uses24hourClock: boolean;
};

const fallbackLocale: Locale = {
  currencyCode: 'MAD',
  currencySymbol: 'MAD',
  decimalSeparator: '.',
  digitGroupingSeparator: ',',
  languageCode: 'fr',
  languageTag: 'fr-MA',
  measurementSystem: 'metric',
  regionCode: 'MA',
  temperatureUnit: 'celsius',
  textDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
};

const fallbackCalendar: Calendar = {
  calendar: 'gregory',
  firstWeekday: 1,
  timeZone: 'Africa/Casablanca',
  uses24hourClock: true,
};

export function getLocales(): [Locale, ...Locale[]] {
  return [fallbackLocale];
}

export function getCalendars(): [Calendar, ...Calendar[]] {
  return [fallbackCalendar];
}

export function useLocales(): [Locale, ...Locale[]] {
  const [locales, setLocales] = useState<[Locale, ...Locale[]]>(() => getLocales());

  useEffect(() => {
    setLocales(getLocales());
  }, []);

  return locales;
}

export function useCalendars(): [Calendar, ...Calendar[]] {
  const [calendars, setCalendars] = useState<[Calendar, ...Calendar[]]>(() => getCalendars());

  useEffect(() => {
    setCalendars(getCalendars());
  }, []);

  return calendars;
}

export default {
  getCalendars,
  getLocales,
  useCalendars,
  useLocales,
};
