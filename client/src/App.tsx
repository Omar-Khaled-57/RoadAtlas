import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleDot,
  Compass,
  GitCompareArrows,
  Map,
  Network,
  Play,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from './components/AppShell';

function ProgressRing({ value, label }: { value: number; label: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3">
      <div
        className="progress-ring"
        style={{ '--progress': `${value * 3.6}deg` } as React.CSSProperties}
      >
        <span>
          {value}
          <small>%</small>
        </span>
      </div>
      <div>
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="font-semibold text-fg-primary">{t('home.complete', { value })}</p>
      </div>
    </div>
  );
}

function RoadmapSketch() {
  const { t } = useTranslation();
  return (
    <svg
      viewBox="0 0 520 220"
      role="img"
      aria-label={t('home.sketch.label')}
      className="h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id="path" x1="0" x2="1">
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>
      <path
        d="M72 111 C145 111 132 49 215 49 S300 111 370 111 S414 54 470 54 M215 49 C294 49 290 173 370 173 S419 111 470 111"
        fill="none"
        stroke="var(--border-default)"
        strokeWidth="2"
        strokeDasharray="5 7"
      />
      <path
        d="M72 111 C145 111 132 49 215 49 S300 111 370 111"
        fill="none"
        stroke="url(#path)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {[
        [72, 111, 'hub'],
        [215, 49, 'web'],
        [370, 111, 'frontend'],
        [470, 54, 'mobile'],
        [370, 173, 'backend'],
        [470, 111, 'cloud'],
      ].map(([x, y, name], i) => (
        <g key={name as string}>
          <circle
            cx={x as number}
            cy={y as number}
            r="19"
            fill="var(--surface-solid)"
            stroke={i < 3 ? 'var(--primary)' : 'var(--border-default)'}
            strokeWidth="2"
          />
          <circle
            cx={x as number}
            cy={y as number}
            r="5"
            fill={i < 3 ? 'var(--primary)' : 'var(--secondary)'}
          />
          <text
            x={x as number}
            y={(y as number) + 38}
            fill="var(--fg-muted)"
            fontSize="11"
            textAnchor="middle"
          >
            {t(`home.sketch.${name}`)}
          </text>
        </g>
      ))}
    </svg>
  );
}

function Home() {
  const { t } = useTranslation();
  return (
    <>
      <section className="hero-panel overflow-hidden rounded-[2rem] border border-border-default p-6 sm:p-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.12fr_.88fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('home.kicker')}
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              {t('home.title')}
              <span className="block text-gradient">{t('home.titleAccent')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-fg-secondary">
              {t('home.subtitle')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/map" className="primary-button">
                {t('home.explore')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/roadmaps" className="secondary-button">
                <BookOpen className="h-4 w-4" />
                {t('home.browse')}
              </Link>
            </div>
          </div>
          <div className="hero-orbit relative mx-auto flex aspect-square w-full max-w-[390px] items-center justify-center">
            <div className="orbit-aura" aria-hidden="true" />
            <div className="orbit-system" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="orbit-node node-a">
                <span className="node-icon text-secondary">
                  <Network />
                </span>
                <span>{t('home.orbit.track')}</span>
              </div>
              <div className="orbit-node node-b">
                <span className="node-icon text-accent">
                  <BookOpen />
                </span>
                <span>{t('home.orbit.learn')}</span>
              </div>
              <div className="orbit-node node-c">
                <span className="node-icon text-success">
                  <Workflow />
                </span>
                <span>{t('home.orbit.combine')}</span>
              </div>
              <div className="orbit-node node-d">
                <span className="node-icon text-primary">
                  <Sparkles />
                </span>
                <span>{t('home.orbit.pick')}</span>
              </div>
              <span className="orbit-spark spark-a" aria-hidden="true">
                ✦
              </span>
              <span className="orbit-spark spark-b" aria-hidden="true">
                ✧
              </span>
              <span className="orbit-ping ping-a" aria-hidden="true" />
              <span className="orbit-ping ping-b" aria-hidden="true" />
              <span className="orbit-ping ping-c" aria-hidden="true" />
            </div>
            <div className="orbit-core">
              <Compass className="h-10 w-10 text-primary" />
              <span className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[.18em] text-fg-muted">
                {t('home.yourAtlas')}
              </span>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-8 grid gap-3 border-t border-border-subtle pt-5 sm:grid-cols-3">
          {[
            ['home.focusTech', 'home.focusTechValue', 'home.currentTech'],
            ['home.focusProject', 'home.focusProjectValue', 'home.currentProject'],
            ['home.nextMilestone', 'home.nextMilestoneValue', 'home.upNext'],
          ].map(([label, value, meta], i) => (
            <div key={label} className="focus-tile">
              <span
                className={`focus-dot ${i === 0 ? 'bg-secondary' : i === 1 ? 'bg-primary' : 'bg-accent'}`}
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-fg-muted">
                  {t(label)}
                </p>
                <p className="mt-1 truncate text-sm font-semibold">{t(value)}</p>
                <p className="mt-0.5 text-xs text-fg-muted">{t(meta)}</p>
              </div>
              <ArrowUpRight className="ms-auto h-4 w-4 shrink-0 text-fg-muted" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
        <article className="surface-card flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="icon-tile bg-primary-soft text-primary">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                {t('home.continue')}
              </p>
              <h2 className="mt-1 text-xl font-bold">{t('home.continueTitle')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('home.continueMeta')}</p>
              <div className="mt-4 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-surface-active">
                <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-primary to-accent" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing value={68} label={t('home.progress')} />
            <Link to="/roadmaps" className="round-arrow" aria-label={t('home.resume')}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
        <article className="surface-card stat-card p-6">
          <div className="flex items-center justify-between">
            <span className="icon-tile bg-secondary-soft text-secondary">
              <Map className="h-5 w-5" />
            </span>
            <span className="trend">
              <ArrowUpRight className="h-3.5 w-3.5" />
              +3
            </span>
          </div>
          <p className="mt-5 text-3xl font-bold">
            12
            <span className="ms-2 text-sm font-medium text-fg-muted">
              {t('home.roadmapsTracked')}
            </span>
          </p>
          <p className="mt-1 text-sm text-fg-muted">{t('home.catalogCaption')}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="surface-card overflow-hidden p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="section-eyebrow">{t('home.mapEyebrow')}</p>
              <h2 className="mt-1 text-xl font-bold">{t('home.mapTitle')}</h2>
            </div>
            <Link
              to="/map"
              className="inline-flex min-h-6 items-center text-sm font-semibold text-primary hover:text-primary-hover"
            >
              {t('home.viewMap')} <ArrowRight className="ms-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="map-preview">
            <RoadmapSketch />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['home.tags.react', 'home.tags.frontend', 'home.tags.backend', 'home.tags.cloud'].map(
              (x, i) => (
                <span key={x} className={`map-tag ${i === 0 ? 'tag-active' : ''}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t(x)}
                </span>
              ),
            )}
          </div>
        </article>
        <article className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">{t('home.activity')}</p>
              <h2 className="mt-1 text-xl font-bold">{t('home.weeklyFocus')}</h2>
            </div>
            <span className="rounded-lg bg-surface-active px-2.5 py-1 text-xs text-fg-muted">
              {t('home.thisWeek')}
            </span>
          </div>
          <div className="mt-7 flex h-36 items-end justify-between gap-2">
            {[38, 61, 45, 82, 56, 72, 94].map((h, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div
                  className={`activity-bar ${i === 6 ? 'activity-today' : ''}`}
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-fg-muted">{t(`home.days.${i}`)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
            <span className="text-sm text-fg-muted">{t('home.focusTime')}</span>
            <strong className="text-lg">
              8.5 <small className="text-xs font-medium text-fg-muted">{t('home.hours')}</small>
            </strong>
          </div>
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-eyebrow">{t('home.catalogEyebrow')}</p>
            <h2 className="mt-1 text-2xl font-bold">{t('home.catalogTitle')}</h2>
          </div>
          <Link
            to="/roadmaps"
            className="inline-flex min-h-6 items-center text-sm font-semibold text-primary"
          >
            {t('home.allRoadmaps')} <ArrowRight className="ms-1 inline h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['home.catalog.frontend', 'home.catalog.frontendSteps', '64%', 'secondary'],
            ['home.catalog.mobile', 'home.catalog.mobileSteps', '28%', 'accent'],
            ['home.catalog.cloud', 'home.catalog.cloudSteps', '12%', 'success'],
          ].map(([title, steps, progress, tone], i) => (
            <article className="roadmap-card" key={title}>
              <div className="flex items-start justify-between">
                <span className={`roadmap-icon tone-${tone}`}>
                  {i === 0 ? <Network /> : i === 1 ? <CircleDot /> : <Workflow />}
                </span>
                <span className="text-xs text-fg-muted">{t(steps)}</span>
              </div>
              <h3 className="mt-5 font-bold">{t(title)}</h3>
              <p className="mt-1 text-xs text-fg-muted">{t('home.updatedRecently')}</p>
              <div className="mt-5 flex items-center justify-between text-xs">
                <span className="text-fg-muted">{t('home.progress')}</span>
                <strong>{progress}</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-active">
                <div
                  className={`h-full rounded-full tone-fill-${tone}`}
                  style={{ width: progress }}
                />
              </div>
              <Link
                to="/roadmaps"
                className="stretched-link"
                aria-label={`${t('home.open')} ${t(title)}`}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="bottom-grid">
        <Link to="/compare" className="mini-feature">
          <span className="icon-tile bg-accent-soft text-accent">
            <GitCompareArrows />
          </span>
          <span className="min-w-0 flex-1">
            <small>{t('home.compareEyebrow')}</small>
            <strong>{t('home.compareTitle')}</strong>
          </span>
          <ArrowUpRight className="h-4 w-4 text-fg-muted" />
        </Link>
        <Link to="/pipelines" className="mini-feature">
          <span className="icon-tile bg-success-soft text-success">
            <Workflow />
          </span>
          <span className="min-w-0 flex-1">
            <small>{t('home.pipelineEyebrow')}</small>
            <strong>{t('home.pipelineTitle')}</strong>
          </span>
          <ArrowUpRight className="h-4 w-4 text-fg-muted" />
        </Link>
        <Link to="/about" className="mini-feature">
          <span className="icon-tile bg-warning-soft text-warning">
            <Sparkles />
          </span>
          <span className="min-w-0 flex-1">
            <small>{t('home.aboutEyebrow')}</small>
            <strong>{t('home.aboutTitle')}</strong>
          </span>
          <ArrowUpRight className="h-4 w-4 text-fg-muted" />
        </Link>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-5 text-xs text-fg-muted">
        <span>
          {t('home.copyright', { year: 2026 })} · {t('home.footer')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-success" />
          {t('home.footerNote')}
        </span>
      </footer>
    </>
  );
}

function Placeholder({ titleKey }: { titleKey: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <Link to="/" className="mb-8 inline-flex min-h-6 items-center gap-2 text-sm text-fg-muted">
        <ArrowDownLeft className="h-4 w-4" />
        {t('home.backHome')}
      </Link>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card p-8"
      >
        <p className="section-eyebrow">{t('app.name')}</p>
        <h2 className="mt-2 text-3xl font-bold">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-fg-muted">{t('placeholder.comingSoon')}</p>
      </motion.section>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Placeholder titleKey="pages.map" />} />
        <Route path="/roadmaps" element={<Placeholder titleKey="pages.roadmaps" />} />
        <Route path="/compare" element={<Placeholder titleKey="pages.compare" />} />
        <Route path="/pipelines" element={<Placeholder titleKey="pages.pipelines" />} />
        <Route path="/login" element={<Placeholder titleKey="pages.login" />} />
        <Route path="*" element={<Placeholder titleKey="pages.notFound" />} />
      </Route>
    </Routes>
  );
}
