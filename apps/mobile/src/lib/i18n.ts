import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from '../../assets/locales/ar.json';
import en from '../../assets/locales/en.json';
import fr from '../../assets/locales/fr.json';

const fallbackLanguage = 'fr';

function detectLanguage() {
  const locale = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  if (locale === 'ar' || locale === 'en' || locale === 'fr') {
    return locale;
  }
  return fallbackLanguage;
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: detectLanguage(),
  fallbackLng: fallbackLanguage,
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
