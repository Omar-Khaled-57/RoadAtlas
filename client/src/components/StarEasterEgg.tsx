import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Portrait-only star easter egg at the footer.
 *
 * Renders a `★` character only when the viewport is in portrait orientation.
 * Triple-clicking within 1 second triggers `onTripleClick` (e.g. opens the
 * login dialog, mirroring the hidden `OMR` keydown sequence on desktop).
 *
 * The star is hidden on landscape/desktop so it doesn't clutter the main view.
 */
export function StarEasterEgg({ onTripleClick }: { onTripleClick: () => void }) {
  const { t } = useTranslation();
  const [portrait, setPortrait] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches,
  );
  const starClicks = useRef(0);
  const starTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const handler = (event: MediaQueryListEvent) => setPortrait(event.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleStarClick = useCallback(() => {
    starClicks.current += 1;
    if (starClicks.current === 3) {
      starClicks.current = 0;
      if (starTimer.current) clearTimeout(starTimer.current);
      onTripleClick();
      return;
    }
    if (starTimer.current) clearTimeout(starTimer.current);
    starTimer.current = setTimeout(() => {
      starClicks.current = 0;
    }, 1000);
  }, [onTripleClick]);

  if (!portrait) return null;

  return (
    <button
      type="button"
      onClick={handleStarClick}
      className="inline-flex items-center justify-center ms-1 w-5 h-5 text-xs text-fg-muted/40 hover:text-fg-primary transition-colors align-middle"
      aria-label={t('footer.starAriaLabel')}
    >
      ★
    </button>
  );
}
