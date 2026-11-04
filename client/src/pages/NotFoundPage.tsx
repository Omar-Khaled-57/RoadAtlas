import { Activity, BookOpen, Compass, GitCompareArrows, Home, Map, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link } from 'react-router-dom';

interface Destination {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  tone: string;
}

const DESTINATIONS: Destination[] = [
  { to: '/roadmaps', labelKey: 'nav.roadmaps', icon: BookOpen, tone: 'primary' },
  { to: '/map', labelKey: 'nav.map', icon: Map, tone: 'secondary' },
  { to: '/compare', labelKey: 'nav.compare', icon: GitCompareArrows, tone: 'accent' },
  { to: '/curves', labelKey: 'curves.title', icon: Activity, tone: 'primary' },
  { to: '/pipelines', labelKey: 'nav.pipelines', icon: Workflow, tone: 'success' },
];

export function NotFoundPage() {
  usePageMeta({ titleKey: 'seo.notFound.title', descriptionKey: 'seo.notFound.description' });
  const { t } = useTranslation();

  return (
    <div className="page-enter space-y-8">
      <section className="surface-card p-8 mt-10 text-center sm:p-12">
        <span className="icon-tile mx-auto bg-primary-soft text-primary">
          <Compass aria-hidden="true" />
        </span>
        <p className="section-eyebrow mt-5">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('notFound.title')}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-fg-muted">{t('notFound.body')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="primary-button">
            <Home aria-hidden="true" className="h-4 w-4" />
            {t('notFound.home')}
          </Link>
          <Link to="/roadmaps" className="secondary-button">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            {t('notFound.roadmaps')}
          </Link>
        </div>
      </section>

      <section aria-labelledby="popular-heading">
        <h2
          id="popular-heading"
          className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted"
        >
          {t('notFound.popular')}
        </h2>
        <ul className="mt-3 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map(({ to, labelKey, icon: Icon, tone }) => (
            <li key={to}>
              <Link to={to} className="mini-feature surface-card">
                <span className={`icon-tile tone-${tone}`}>
                  <Icon aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong>{t(labelKey)}</strong>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
