import type { LucideIcon } from 'lucide-react';
import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme, type Theme } from '../theme/theme-context';

const ICONS: Record<Theme, LucideIcon | null> = {
  dark: Moon,
  light: Sun,
  ocean: null,
};

const OCEAN_ICON_SRC = '/ocean.png';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const label = t('theme.cycle');
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={`${t('theme.name')}: ${t(`theme.${theme}`)}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-fg-primary transition hover:bg-surface-hover"
    >
      {Icon ? (
        <Icon className="h-4 w-4" />
      ) : (
        // Black ocean artwork on transparent → invert to a white silhouette for the dark ocean theme.
        <img src={OCEAN_ICON_SRC} alt="" aria-hidden="true" className="h-4 w-4 invert" />
      )}
    </button>
  );
}
