import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Check,
  GitCompareArrows,
  LogIn,
  LogOut,
  Map,
  MapPinned,
  Menu,
  Workflow,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import type { AuthSession, HealthResponse } from '@shared/index';
import { api } from '../lib/api';
import { Background } from './Background';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';

function HealthBadge() {
  const { t } = useTranslation();
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => (await api.get<HealthResponse>('/api/health')).data,
    retry: false,
    refetchInterval: 60_000,
  });
  const ok = !isError && data?.status === 'ok';
  return (
    <span className="hidden items-center gap-2 rounded-full border border-border-default bg-surface px-3 py-1.5 text-xs text-fg-muted sm:inline-flex">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-success' : 'bg-error'}`} />
      {ok ? t('health.online') : t('health.offline')}
    </span>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await api.get<AuthSession>('/api/auth/session')).data,
    retry: false,
  });
  const logout = useMutation({
    mutationFn: async () => (await api.post<AuthSession>('/api/auth/logout')).data,
    onSuccess: (nextSession) => queryClient.setQueryData(['session'], nextSession),
  });
  const nav = [
    { to: '/roadmaps', label: t('nav.roadmaps'), icon: BookOpen },
    { to: '/map', label: t('nav.map'), icon: Map },
    { to: '/compare', label: t('nav.compare'), icon: GitCompareArrows },
    { to: '/pipelines', label: t('nav.pipelines'), icon: Workflow },
  ];
  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="relative min-h-screen text-fg-primary">
      <Background />
      <header className="sticky top-0 z-30 border-b border-border-subtle bg-bg-base/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3" onClick={closeMenu}>
            <span className="brand-mark">
              <MapPinned className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              {t('app.name')}
              <span className="ms-2 hidden rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary sm:inline-block">
                {t('home.badge')}
              </span>
            </span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-0.5 lg:flex">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-fg-muted transition hover:bg-surface-hover hover:text-fg-primary"
              >
                <Icon className="hidden h-4 w-4 shrink-0 xl:block" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <HealthBadge />
            {session?.authenticated ? (
              <button
                type="button"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                aria-label={t('nav.logout')}
                className="hidden h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-fg-primary transition hover:bg-surface-hover disabled:opacity-60 sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden text-xs font-medium md:inline">{t('nav.logout')}</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="hidden h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-fg-primary transition hover:bg-surface-hover sm:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden text-xs font-medium md:inline">{t('nav.login')}</span>
              </Link>
            )}
            <span className="hidden sm:inline-flex">
              <LanguageToggle />
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-fg-primary transition hover:bg-surface-hover lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="mobile-nav"
            className="border-t border-border-subtle bg-bg-base/95 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:px-8">
              {nav.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg-muted transition hover:bg-surface-hover hover:text-fg-primary"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-3 sm:hidden">
                <span className="inline-flex">
                  <LanguageToggle />
                </span>
                {session?.authenticated ? (
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      logout.mutate();
                    }}
                    disabled={logout.isPending}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-fg-primary transition hover:bg-surface-hover disabled:opacity-60"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-xs font-medium">{t('nav.logout')}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-fg-primary transition hover:bg-surface-hover"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="text-xs font-medium">{t('nav.login')}</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>
      <main className="relative z-10 mx-auto max-w-7xl space-y-7 px-5 pb-16 pt-6 sm:px-8">
        <Outlet />
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5 text-xs text-fg-muted">
          <span>
            {t('footer.copyright', { year: 2026 })} · {t('footer.tagline')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            {t('footer.note')}
          </span>
        </footer>
      </main>
    </div>
  );
}
