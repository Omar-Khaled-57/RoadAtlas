import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  titleKey: string;
  children: React.ReactNode;
}

/**
 * Accessible dialog primitive following the LoginDialog pattern:
 * portal to body, focus trap, ESC to close, backdrop click to close,
 * role="dialog" with aria-modal.
 */
export function Dialog({ open, onClose, titleKey, children }: DialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    return () => returnFocusRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('common.close')}
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="surface-card relative w-full max-w-md p-7 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('common.close')}
          className="absolute end-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition hover:bg-surface-hover hover:text-fg-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="dialog-title" className="pe-10 text-2xl font-bold tracking-tight">
          {t(titleKey)}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
