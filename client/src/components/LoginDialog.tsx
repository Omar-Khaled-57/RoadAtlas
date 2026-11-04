import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { LoaderCircle, LockKeyhole, Mail, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { AuthSession, LoginCredentials } from '@shared/index';
import { api } from '../lib/api';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
}

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleClose = () => {
    setPassword('');
    login.reset();
    onClose();
  };

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) =>
      (await api.post<AuthSession>('/api/auth/login', credentials)).data,
    onSuccess: async (session) => {
      queryClient.setQueryData(['session'], session);
      await queryClient.invalidateQueries();
      handleClose();
    },
  });

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
        'button:not([disabled]), input:not([disabled]), a[href]',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  if (!open) return null;

  const axiosError = isAxiosError(login.error) ? login.error : null;
  const errorKey = login.isError
    ? !axiosError?.response
      ? 'auth.connectionError'
      : axiosError.response.status === 503
        ? 'auth.unavailable'
        : 'auth.invalid'
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('auth.closeDialog')}
        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-dialog-title"
        aria-describedby="login-dialog-description"
        className="surface-card relative w-full max-w-md p-7 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label={t('auth.closeDialog')}
          className="absolute end-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition hover:bg-surface-hover hover:text-fg-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2 id="login-dialog-title" className="pe-10 text-2xl font-bold tracking-tight">
          {t('auth.title')}
        </h2>
        <p id="login-dialog-description" className="mt-2 mb-6 text-sm leading-6 text-fg-muted">
          {t('auth.description')}
        </p>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <label htmlFor="dialog-login-email" className="text-sm font-semibold text-fg-secondary">
              {t('auth.email')}
            </label>
            <span className="relative">
              <Mail
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
                aria-hidden="true"
              />
              <input
                id="dialog-login-email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                dir="ltr"
                required
                autoFocus
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface-solid py-3 ps-10 pe-4 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              />
            </span>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="dialog-login-password"
              className="text-sm font-semibold text-fg-secondary"
            >
              {t('auth.password')}
            </label>
            <span className="relative">
              <LockKeyhole
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
                aria-hidden="true"
              />
              <input
                id="dialog-login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                required
                maxLength={200}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface-solid py-3 ps-10 pe-4 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              />
            </span>
          </div>

          {errorKey && (
            <p
              role="alert"
              className="rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error"
            >
              {t(errorKey)}
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending || !email.trim() || !password}
            className="primary-button mt-2 min-h-11 justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {login.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {login.isPending ? t('auth.submitting') : t('auth.submit')}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
