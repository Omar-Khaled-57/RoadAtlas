import { Moon, Sun, Waves } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme, type Theme } from '../theme/theme-context';

const ICONS: Record<Theme, typeof Moon> = {
  dark: Moon,
  light: Sun,
  ocean: Waves,
};

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const Icon = ICONS[theme];
  const label = t('theme.cycle');

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={`${t('theme.name')}: ${t(`theme.${theme}`)}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-surface text-fg-primary transition hover:bg-surface-hover"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
