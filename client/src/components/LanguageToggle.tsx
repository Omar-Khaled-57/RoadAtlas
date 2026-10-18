import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Lang } from '../i18n';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const next: Lang = i18n.language === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={t('language.switch')}
      title={t('language.switch')}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-fg-primary transition hover:bg-surface-hover"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium">{t('language.name')}</span>
    </button>
  );
}
