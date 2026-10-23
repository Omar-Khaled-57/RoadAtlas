import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Check,
  FileText,
  GitCompareArrows,
  LogIn,
  LogOut,
  Map,
  MapPinned,
  Menu,
  Search,
  Workflow,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router-dom';
import type { AuthSession, HealthResponse } from '@shared/index';
import { api } from '../lib/api';
import { Background } from './Background';
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
import { useDocumentDirection } from '../lib/i18nSync';

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
    <span
      role="status"
      className="hidden h-9 items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-xs text-fg-muted sm:inline-flex"
    >
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-success' : 'bg-error'}`} />
      {ok ? t('health.online') : t('health.offline')}
    </span>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  useDocumentDirection();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
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
    { to: '/knowledge', label: t('nav.knowledge'), icon: BookOpen },
    { to: '/decisions', label: t('nav.decisions'), icon: FileText },
    { to: '/search', label: t('nav.search'), icon: Search },
  ];
  const openMenu = () => {
    setMenuMounted(true);
    window.requestAnimationFrame(() => setMenuOpen(true));
  };
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);
  useEffect(() => {
    if (menuOpen || !menuMounted) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeout = window.setTimeout(() => setMenuMounted(false), reducedMotion ? 0 : 320);
    return () => window.clearTimeout(timeout);
  }, [menuOpen, menuMounted]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        window.location.assign('/search');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen text-fg-primary">
      <Background />
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/90 shadow-sm shadow-fg-primary/5 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3 sm:px-8 sm:py-3.5 xl:flex-nowrap">
          <Link to="/" className="group flex shrink-0 items-center gap-3" onClick={closeMenu}>
            <span className="brand-mark transition-transform duration-200 group-hover:-rotate-3">
              <MapPinned className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              {t('app.name')}
              <span className="ms-2 hidden rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary sm:inline-block">
                {t('home.badge')}
              </span>
            </span>
          </Link>
          <nav className="hidden shrink-0 items-center gap-0.5 lg:ms-2 lg:flex xl:ms-4">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-fg-muted hover:bg-surface-hover hover:text-fg-primary'
                  }`
                }
              >
                <Icon className="hidden h-4 w-4 shrink-0 opacity-80 xl:block" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ms-auto flex shrink-0 items-center gap-1.5 xl:gap-2">
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
              onClick={() => (menuOpen ? closeMenu() : openMenu())}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-fg-primary transition hover:bg-surface-hover lg:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {menuMounted &&
          createPortal(
            <>
              <button
                type="button"
                aria-label={t('nav.closeMenu')}
                className={`mobile-nav-backdrop fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px] lg:hidden ${menuOpen ? 'is-open' : ''}`}
                onClick={closeMenu}
              />
              <nav
                id="mobile-nav"
                className={`mobile-nav-panel fixed inset-y-0 end-0 z-[70] w-[min(88vw,360px)] border-s border-border-subtle bg-surface-solid shadow-2xl lg:hidden ${menuOpen ? 'is-open' : ''}`}
                style={{
                  paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
                  background: 'var(--surface-solid)',
                }}
              >
                <div className="mx-auto flex h-full flex-col px-5 pb-6 pt-2 sm:px-6">
                  <div className="mb-6 flex items-center justify-between border-b border-border-subtle pb-4">
                    <div className="flex items-center gap-3">
                      <span className="brand-mark h-10 w-10"><MapPinned className="h-5 w-5" /></span>
                      <span className="text-base font-bold tracking-tight text-fg-primary">{t('app.name')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={closeMenu}
                      aria-label={t('nav.closeMenu')}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-strong bg-surface text-fg-primary transition hover:bg-surface-hover"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mobile-nav-links flex flex-col gap-2">
                  {nav.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={closeMenu}
                      className={({ isActive }) => `mobile-nav-link flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition ${isActive ? 'is-active' : ''}`}
                    >
                      <span className="mobile-nav-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary"><Icon className="h-[18px] w-[18px]" /></span>
                      <span className="flex-1">{label}</span>
                      <span className="mobile-nav-indicator h-1.5 w-1.5 rounded-full bg-primary opacity-0 transition-opacity" />
                    </NavLink>
                  ))}
                  </div>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
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
            </>,
            document.body,
          )}
      </header>
      <main
        id="main-content"
        className="relative z-10 mx-auto max-w-7xl space-y-7 px-5 pt-6 sm:px-8"
      >
        <Outlet />
      </main>
      <footer className="relative mx-auto mt-7 max-w-7xl px-5 pb-16 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface px-4 py-3 text-xs text-fg-muted">
          <span>
            {t('footer.copyright', { year: 2026 })} · {t('footer.tagline')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            {t('footer.note')}
          </span>
        </div>
      </footer>
    </div>
  );
}
