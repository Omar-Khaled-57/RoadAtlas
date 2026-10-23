import {
  ArrowLeftRight,
  ArrowRight,
  Blocks,
  Compass,
  ExternalLink,
  Footprints,
  Languages,
  Layers,
  MonitorSmartphone,
  Palette,
  Server,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link } from 'react-router-dom';

const SOURCE_CONVERSATION = 'https://chatgpt.com/share/6ad078b0-f308-83ea-9654-c84e63fe42c1';

type Tone = 'primary' | 'secondary' | 'accent' | 'success';

interface IconItem {
  key: string;
  icon: LucideIcon;
  tone: Tone;
}

const PILLARS: IconItem[] = [
  { key: 'modular', icon: Blocks, tone: 'primary' },
  { key: 'incremental', icon: Footprints, tone: 'secondary' },
  { key: 'themeAware', icon: Palette, tone: 'accent' },
  { key: 'directionAware', icon: Compass, tone: 'success' },
];

const PRACTICES: IconItem[] = [
  { key: 'tokens', icon: Layers, tone: 'primary' },
  { key: 'themes', icon: Palette, tone: 'accent' },
  { key: 'i18n', icon: Languages, tone: 'secondary' },
  { key: 'rtl', icon: ArrowLeftRight, tone: 'success' },
];

const STACK: IconItem[] = [
  { key: 'client', icon: MonitorSmartphone, tone: 'primary' },
  { key: 'server', icon: Server, tone: 'secondary' },
  { key: 'shared', icon: Share2, tone: 'accent' },
];

export function AboutPage() {
  usePageMeta({ titleKey: 'seo.about.title', descriptionKey: 'seo.about.description' });
  const { t } = useTranslation();

  return (
    <div className="page-enter space-y-6">
      <header className="hero-panel overflow-hidden rounded-[2rem] border border-border-default p-6 sm:p-10">
        <p className="section-eyebrow">{t('about.eyebrow')}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {t('about.title')}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-fg-secondary">{t('about.lead')}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">{t('about.mission')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/roadmaps" className="primary-button">
            {t('about.browse')}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
          </Link>
          <Link to="/map" className="secondary-button">
            <Compass className="h-4 w-4" aria-hidden="true" />
            {t('about.exploreMap')}
          </Link>
        </div>
      </header>

      <section aria-labelledby="about-tdaim" className="space-y-4">
        <header>
          <p className="section-eyebrow">{t('about.tdaim.eyebrow')}</p>
          <h2 id="about-tdaim" className="mt-1 text-2xl font-bold">
            {t('about.tdaim.title')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('about.tdaim.subtitle')}</p>
        </header>
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
          {PILLARS.map(({ key, icon: Icon, tone }) => (
            <li key={key} className="surface-card p-6">
              <span className={`icon-tile tone-${tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{t(`about.tdaim.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-secondary">
                {t(`about.tdaim.${key}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-applies" className="surface-card p-6">
        <h2 id="about-applies" className="text-2xl font-bold">
          {t('about.applies.title')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('about.applies.subtitle')}</p>
        <ul className="mt-5 grid list-none gap-x-6 gap-y-4 p-0 sm:grid-cols-2">
          {PRACTICES.map(({ key, icon: Icon, tone }) => (
            <li key={key} className="flex items-start gap-3">
              <span className={`icon-tile tone-${tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{t(`about.applies.${key}.label`)}</p>
                <p className="mt-1 text-sm leading-6 text-fg-muted">
                  {t(`about.applies.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-origin" className="surface-card p-6">
        <h2 id="about-origin" className="text-2xl font-bold">
          {t('about.origin.title')}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-secondary">
          {t('about.origin.body1')}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-secondary">
          {t('about.origin.body2')}
        </p>
        <a
          href={SOURCE_CONVERSATION}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex min-h-6 items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {t('about.origin.research')}
          <span className="sr-only"> ({t('about.origin.newTab')})</span>
        </a>
      </section>

      <section aria-labelledby="about-stack" className="space-y-4">
        <header>
          <h2 id="about-stack" className="text-2xl font-bold">
            {t('about.stack.title')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('about.stack.subtitle')}</p>
        </header>
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-3">
          {STACK.map(({ key, icon: Icon, tone }) => (
            <li key={key} className="surface-card p-6">
              <span className={`icon-tile tone-${tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-bold">{t(`about.stack.${key}.label`)}</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">{t(`about.stack.${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
