import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowDownLeft, LoaderCircle, LockKeyhole, Mail, MapPinned } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { AuthSession, LoginCredentials } from '@shared/index';
import { api } from '../lib/api';

function safeReturnPath(value: string | null): string {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export function LoginPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: async (credentials: LoginCredentials) =>
      (await api.post<AuthSession>('/api/auth/login', credentials)).data,
    onSuccess: async (session) => {
      queryClient.setQueryData(['session'], session);
      await navigate(safeReturnPath(new URLSearchParams(location.search).get('returnTo')), {
        replace: true,
      });
    },
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  const axiosError = isAxiosError(login.error) ? login.error : null;
  const errorKey = login.isError
    ? !axiosError?.response
      ? 'auth.connectionError'
      : axiosError.response.status === 503
        ? 'auth.unavailable'
        : 'auth.invalid'
    : null;

  return (
    <section className="mx-auto grid min-h-[58vh] w-full max-w-md content-center">
      <div className="surface-card page-enter overflow-hidden p-7 sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="brand-mark">
            <MapPinned className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="section-eyebrow">{t('app.name')}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{t('auth.title')}</h1>
          </div>
        </div>

        <p className="mb-6 text-sm leading-6 text-fg-muted">{t('auth.description')}</p>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <label htmlFor="login-email" className="text-sm font-semibold text-fg-secondary">
              {t('auth.email')}
            </label>
            <span className="relative">
              <Mail
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
                aria-hidden="true"
              />
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                dir="ltr"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-border-default bg-surface-solid py-3 ps-10 pe-4 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              />
            </span>
          </div>

          <div className="grid gap-2">
            <label htmlFor="login-password" className="text-sm font-semibold text-fg-secondary">
              {t('auth.password')}
            </label>
            <span className="relative">
              <LockKeyhole
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
                aria-hidden="true"
              />
              <input
                id="login-password"
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

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg-primary"
        >
          <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('home.backHome')}
        </Link>
      </div>
    </section>
  );
}
