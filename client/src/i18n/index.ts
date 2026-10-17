import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const supportedLangs = ['en', 'ar'] as const;
export type Lang = (typeof supportedLangs)[number];

export const RTL_LANGS: Lang[] = ['ar'];

const STORAGE_KEY = 'roadatlas.lang';

function isLang(value: string | null): value is Lang {
  return value === 'en' || value === 'ar';
}

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* ignore */
  }
  return navigator.language?.startsWith('ar') ? 'ar' : 'en';
}

export function applyDir(lang: string): void {
  const dir = RTL_LANGS.includes(lang as Lang) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getInitialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

applyDir(i18n.language);
i18n.on('languageChanged', applyDir);

export default i18n;
