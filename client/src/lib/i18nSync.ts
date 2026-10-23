import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useDocumentDirection() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'en';
    document.documentElement.lang = lang.startsWith('ar') ? 'ar' : 'en';
    document.documentElement.dir = lang.startsWith('ar') ? 'rtl' : 'ltr';
  }, [i18n.language]);
}
