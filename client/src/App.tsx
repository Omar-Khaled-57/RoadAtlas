import { usePageMeta } from './lib/seo';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CircleDot,
  Combine,
  Compass,
  GitCompareArrows,
  GraduationCap,
  Map,
  MousePointerClick,
  Network,
  Pencil,
  Play,
  Plus,
  Route as RouteIcon,
  Sparkles,
  Workflow,
  Trash2,
} from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFoundPage } from './pages/NotFoundPage';
import { OwnerFocusPanel } from './components/OwnerFocusPanel';
import { ProgressRing } from './components/ProgressRing';
import { useFocusView } from './data/focus';
import { useComparisons, useMetrics, useSession, useSetFocus } from './data/queries';
import { roadmapProgress } from './data/roadmaps';
import { useRoadmapGraph, type RoadmapView } from './data/roadmapGraph';
import { localize } from './lib/localize';
import { OwnerRoadmaps } from './components/OwnerRoadmaps';
import { WeeklyFocusBoard } from './components/WeeklyFocusBoard';
import type { FocusItemKind } from '@shared/index';

const MapPage = lazy(() => import('./pages/MapPage'));
const RoadmapsPage = lazy(() =>
  import('./pages/RoadmapsPage').then((module) => ({ default: module.RoadmapsPage })),
);
const RoadmapDetailPage = lazy(() =>
  import('./pages/RoadmapDetailPage').then((module) => ({ default: module.RoadmapDetailPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((module) => ({ default: module.AboutPage })),
);
const ComparePage = lazy(() =>
  import('./pages/ComparePage').then((module) => ({ default: module.ComparePage })),
);
const CurvesPage = lazy(() => import('./pages/CurvesPage'));
const PipelinesPage = lazy(() =>
  import('./pages/PipelinesPage').then((module) => ({ default: module.PipelinesPage })),
);
const PipelineDetailPage = lazy(() =>
  import('./pages/PipelineDetailPage').then((module) => ({ default: module.PipelineDetailPage })),
);
const KnowledgePage = lazy(() =>
  import('./pages/KnowledgePage').then((module) => ({ default: module.KnowledgePage })),
);
const KnowledgeDetailPage = lazy(() => import('./pages/KnowledgeDetailPage'));
const DecisionsPage = lazy(() =>
  import('./pages/DecisionsPage').then((module) => ({ default: module.DecisionsPage })),
);
const DecisionsDetailPage = lazy(() => import('./pages/DecisionsDetailPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="surface-card grid min-h-[100dvh] place-items-center p-10 text-center text-sm text-fg-muted"
      role="status"
    >
      {t('common.loading')}
    </div>
  );
}

function RoadmapSketch({ roadmaps, lang }: { roadmaps: RoadmapView[]; lang: string }) {
  const { t } = useTranslation();
  const positions: Array<[number, number]> = [
    [72, 111],
    [215, 49],
    [370, 111],
    [470, 54],
    [370, 173],
    [470, 111],
  ];
  const nodes = roadmaps.slice(0, positions.length);
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
      {nodes.map((roadmap, i) => {
        const [x, y] = positions[i];
        const title = localize(roadmap.title, lang);
        return (
          <Link key={roadmap.id} to={`/roadmaps/${roadmap.id}`} aria-label={title}>
            <g className="cursor-pointer">
              <title>{title}</title>
              <circle
                cx={x}
                cy={y}
                r="19"
                fill="var(--surface-solid)"
                stroke={i < 3 ? 'var(--primary)' : 'var(--border-default)'}
                strokeWidth="2"
              />
              <circle cx={x} cy={y} r="5" fill={i < 3 ? 'var(--primary)' : 'var(--secondary)'} />
              <text x={x} y={y + 38} fill="var(--fg-muted)" fontSize="11" textAnchor="middle">
                {title.length > 16 ? `${title.slice(0, 15)}…` : title}
              </text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}

function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const focus = useFocusView();
  const saveFocus = useSetFocus();
  const [focusEditorOpen, setFocusEditorOpen] = useState(false);
  const [focusEditorItemId, setFocusEditorItemId] = useState<string | undefined>();
  const [focusEditorAddRow, setFocusEditorAddRow] = useState(false);
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const { roadmaps, isLoading: roadmapsLoading } = useRoadmapGraph();
  const comparisonsQuery = useComparisons('public');
  const metricsQuery = useMetrics('public');
  const roadmapPreview = roadmaps.slice(0, 10);
  const comparisons = comparisonsQuery.data ?? [];
  const metrics = metricsQuery.data ?? [];
  usePageMeta({ titleKey: 'seo.home.title', descriptionKey: 'seo.home.description' });

  const focusTiles: Array<{
    id: string;
    kind: FocusItemKind;
    label: string;
    value: string;
    meta: string;
    href?: string;
    highlighted?: boolean;
  }> = focus.ready
    ? focus.items.map((item) => ({
        id: item.id,
        kind: item.kind,
        label:
          item.kind === 'technology'
            ? 'home.focusTech'
            : item.kind === 'project'
              ? 'home.focusProject'
              : 'home.nextMilestone',
        value: item.title,
        meta:
          item.kind === 'milestone'
            ? item.subtitle
            : t(item.kind === 'technology' ? 'home.currentTech' : 'home.currentProject'),
        href: item.href,
        highlighted: item.highlighted,
      }))
    : [];
  const topicTags = [
    ...new Set(roadmaps.flatMap((roadmap) => (roadmap.topics ?? []).map((t) => localize(t, lang)))),
  ].slice(0, 8);

  function openFocusEditor(id?: string, addRow = false) {
    setFocusEditorItemId(id);
    setFocusEditorAddRow(addRow);
    setFocusEditorOpen(true);
  }

  function removeFocusItem(id: string) {
    const remaining = focus.items
      .filter((item) => item.id !== id)
      .map(({ id: itemId, kind, targetId, highlighted }) => ({
        id: itemId,
        kind,
        targetId,
        highlighted,
      }));
    if (remaining.length && !remaining.some((item) => item.highlighted)) {
      remaining[0] = { ...remaining[0], highlighted: true };
    }
    saveFocus.mutate({ items: remaining });
  }

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
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
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
                  <RouteIcon />
                </span>
                <span>{t('home.orbit.track')}</span>
              </div>
              <div className="orbit-node node-b">
                <span className="node-icon text-accent">
                  <GraduationCap />
                </span>
                <span>{t('home.orbit.learn')}</span>
              </div>
              <div className="orbit-node node-c">
                <span className="node-icon text-success">
                  <Combine />
                </span>
                <span>{t('home.orbit.combine')}</span>
              </div>
              <div className="orbit-node node-d">
                <span className="node-icon text-primary">
                  <MousePointerClick />
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
          {focusTiles.map((tile, i) => {
            const className = `focus-tile ${tile.highlighted ? 'focus-tile--highlight' : ''}`;
            return (
              <div key={tile.id ?? `${tile.label}-${i}`} className={className}>
                <span
                  className={`focus-dot ${i === 0 ? 'bg-secondary' : i === 1 ? 'bg-primary' : 'bg-accent'}`}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-fg-muted">
                    {t(tile.label)}
                  </p>
                  {tile.href ? (
                    <Link
                      to={tile.href}
                      className="mt-1 block truncate text-sm font-semibold hover:text-primary"
                    >
                      {tile.value}
                    </Link>
                  ) : (
                    <p className="mt-1 truncate text-sm font-semibold">{tile.value}</p>
                  )}
                  <p className="mt-0.5 truncate text-xs text-fg-muted">{tile.meta}</p>
                </div>
                {authenticated ? (
                  <div className="ms-auto flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="secondary-button !min-h-8 !px-2"
                      aria-label={`${t('common.edit')} ${t(tile.label)}`}
                      onClick={() => openFocusEditor(tile.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {!tile.id.startsWith('slot:') ? (
                      <button
                        type="button"
                        className="secondary-button !min-h-8 !px-2"
                        aria-label={`${t('common.delete')} ${t(tile.label)}`}
                        disabled={saveFocus.isPending}
                        onClick={() => removeFocusItem(tile.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ) : tile.href ? (
                  <ArrowUpRight className="ms-auto h-4 w-4 shrink-0 text-fg-muted rtl:-scale-x-100" />
                ) : null}
              </div>
            );
          })}
          {authenticated ? (
            <button
              type="button"
              className="focus-tile justify-center border-dashed text-sm font-semibold text-primary"
              onClick={() => openFocusEditor(undefined, true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('focusPanel.addRow')}
            </button>
          ) : null}
        </div>
      </section>

      <OwnerFocusPanel
        open={focusEditorOpen}
        focusItemId={focusEditorItemId}
        addRowOnOpen={focusEditorAddRow}
        onClose={() => {
          setFocusEditorOpen(false);
          setFocusEditorAddRow(false);
        }}
      />

      <section className="grid gap-4 lg:grid-cols-[1.5fr_.8fr]">
        {authenticated && focus.lastVisited ? (
          <article className="surface-card flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="icon-tile bg-primary-soft text-primary">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                  {t('home.continue')}
                </p>
                <h2 className="mt-1 text-xl font-bold">{focus.lastVisited.title}</h2>
                <p className="mt-1 text-sm text-fg-muted">
                  {focus.lastVisited.nextStepTitle
                    ? t('home.resumeStep', { step: focus.lastVisited.nextStepTitle })
                    : t('home.resumeAllDone')}
                </p>
                <div className="mt-4 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-surface-active">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{ width: `${focus.lastVisited.percent}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <ProgressRing
                value={focus.lastVisited.percent}
                label={t('home.progress')}
                caption={t('home.complete', { value: focus.lastVisited.percent })}
              />
              <Link
                to={`/roadmaps/${focus.lastVisited.roadmapId}${focus.lastVisited.nextStepId ? `#step-${focus.lastVisited.nextStepId}` : ''}`}
                className="round-arrow"
                aria-label={t('home.resume')}
              >
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
              </Link>
              <button
                type="button"
                className="secondary-button"
                onClick={() => saveFocus.mutate({ lastVisited: null })}
              >
                {t('home.dismiss')}
              </button>
            </div>
          </article>
        ) : (
          <article className="surface-card flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="icon-tile bg-primary-soft text-primary">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">
                  {t('home.continue')}
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {roadmaps[0] ? localize(roadmaps[0].title, lang) : t('home.continueTitle')}
                </h2>
                <p className="mt-1 text-sm text-fg-muted">{t('home.continueMeta')}</p>
              </div>
            </div>
            <Link
              to={roadmaps[0] ? `/roadmaps/${roadmaps[0].id}` : '/roadmaps'}
              className="round-arrow"
              aria-label={t('home.resume')}
            >
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </article>
        )}
        <article className="surface-card stat-card p-6">
          <div className="flex items-center justify-between">
            <span className="icon-tile bg-secondary-soft text-secondary">
              <Map className="h-5 w-5" />
            </span>
            <span className="trend">
              <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
              +3
            </span>
          </div>
          <p className="mt-5 text-3xl font-bold">
            {roadmaps.length}
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
              {t('home.viewMap')} <ArrowRight className="ms-1 inline h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </div>
          {roadmapsLoading ? (
            <div
              className="map-preview grid place-items-center text-sm text-fg-muted"
              role="status"
            >
              {t('common.loading')}
            </div>
          ) : roadmaps.length ? (
            <div className="map-preview">
              <RoadmapSketch roadmaps={roadmaps} lang={lang} />
            </div>
          ) : (
            <div className="map-preview grid place-items-center text-center text-sm text-fg-muted">
              <div>
                <p>{t('home.mapEmpty')}</p>
                <Link to="/roadmaps" className="mt-2 inline-flex text-primary">
                  {t('home.manageRoadmaps')}
                </Link>
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {topicTags.map((topic, index) => (
              <span key={topic} className={`map-tag ${index === 0 ? 'tag-active' : ''}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {topic}
              </span>
            ))}
          </div>
        </article>
        <WeeklyFocusBoard />
      </section>
      <OwnerRoadmaps />

      <section className="surface-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="section-eyebrow">{t('home.tdaim.eyebrow')}</p>
            <h2 className="mt-1 text-lg font-bold sm:text-xl">{t('home.tdaim.title')}</h2>
          </div>
          <Link
            to="/about"
            className="inline-flex min-h-6 items-center text-xs font-semibold text-primary hover:text-primary-hover sm:text-sm"
          >
            {t('home.explore')} <ArrowRight className="ms-1 inline h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-fg-secondary">{t('home.tdaim.body')}</p>
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
            {t('home.allRoadmaps')} <ArrowRight className="ms-1 inline h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>
        {roadmapsLoading ? (
          <p role="status" className="text-sm text-fg-muted">
            {t('common.loading')}
          </p>
        ) : null}
        {!roadmapsLoading && roadmapPreview.length === 0 ? (
          <p className="surface-card p-6 text-sm text-fg-muted">{t('home.mapEmpty')}</p>
        ) : null}
        {roadmapPreview.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {roadmapPreview.map((roadmap) => {
              const steps = roadmap.steps;
              const percent = roadmapProgress(roadmap);
              const tone =
                roadmap.kind === 'hub'
                  ? 'primary'
                  : roadmap.kind === 'pipeline'
                    ? 'accent'
                    : 'secondary';
              const Icon =
                roadmap.kind === 'hub'
                  ? Network
                  : roadmap.kind === 'pipeline'
                    ? Workflow
                    : CircleDot;
              return (
                <article className="roadmap-card" key={roadmap.id}>
                  <div className="flex items-start justify-between">
                    <span className={`roadmap-icon tone-${tone}`}>
                      <Icon aria-hidden="true" />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-fg-muted">
                        {t('roadmaps.steps', { value: steps.length })}
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 text-fg-muted rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <h3 className="mt-5 font-bold">{localize(roadmap.title, lang)}</h3>
                  <p className="mt-1 line-clamp-2 min-h-8 text-xs text-fg-muted">
                    {localize(roadmap.description ?? roadmap.title, lang)}
                  </p>
                  {authenticated ? (
                    <>
                      <div className="mt-5 flex items-center justify-between text-xs">
                        <span className="text-fg-muted">{t('home.progress')}</span>
                        <strong>{percent}%</strong>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-active">
                        <div
                          className={`h-full rounded-full tone-fill-${tone}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </>
                  ) : null}
                  <Link
                    to={`/roadmaps/${roadmap.id}`}
                    className="stretched-link"
                    aria-label={`${t('home.open')} ${localize(roadmap.title, lang)}`}
                  />
                </article>
              );
            })}
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-eyebrow">{t('home.curvesEyebrow')}</p>
            <h2 className="mt-1 text-2xl font-bold">{t('home.curvesTitle')}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t('home.curvesSubtitle')}</p>
          </div>
          <Link
            to="/curves"
            className="inline-flex min-h-6 items-center text-sm font-semibold text-primary"
          >
            {t('home.curvesCta')} <ArrowRight className="ms-1 inline h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>
        <article className="surface-card p-6">
          {metrics[0] ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag-chip">{localize(metrics[0].axis.label, lang)}</span>
                <span className="text-xs text-fg-muted">
                  {metrics[0].points.length} {t('home.curvesPoints')}
                </span>
              </div>
              <p className="text-sm leading-7 text-fg-secondary">
                {localize(metrics[0].finding, lang)}
              </p>
            </div>
          ) : null}
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="section-eyebrow">{t('home.compareEyebrow')}</p>
            <h2 className="mt-1 text-2xl font-bold">{t('home.comparePreviewTitle')}</h2>
            <p className="mt-2 text-sm text-fg-muted">{t('home.comparePreviewSubtitle')}</p>
          </div>
          <Link
            to="/compare"
            className="inline-flex min-h-6 items-center text-sm font-semibold text-primary"
          >
            {t('home.comparePreviewCta')}{' '}
            <ArrowRight className="ms-1 inline h-4 w-4 rtl:-scale-x-100" />
          </Link>
        </div>
        <article className="surface-card p-6">
          {comparisons[0] ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{localize(comparisons[0].title, lang)}</h3>
              <div className="flex flex-wrap gap-2">
                {(comparisons[0].candidateTechIds || []).map((tid) => (
                  <span key={tid} className="tag-chip">
                    {tid}
                  </span>
                ))}
              </div>
              {comparisons[0].conclusion ? (
                <p className="text-sm leading-7 text-fg-secondary">
                  {localize(comparisons[0].conclusion, lang)}
                </p>
              ) : null}
            </div>
          ) : null}
        </article>
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
          <ArrowUpRight className="h-4 w-4 text-fg-muted rtl:-scale-x-100" />
        </Link>
        <Link to="/pipelines" className="mini-feature">
          <span className="icon-tile bg-success-soft text-success">
            <Workflow />
          </span>
          <span className="min-w-0 flex-1">
            <small>{t('home.pipelineEyebrow')}</small>
            <strong>{t('home.pipelineTitle')}</strong>
          </span>
          <ArrowUpRight className="h-4 w-4 text-fg-muted rtl:-scale-x-100" />
        </Link>
        <Link to="/about" className="mini-feature">
          <span className="icon-tile bg-warning-soft text-warning">
            <Sparkles />
          </span>
          <span className="min-w-0 flex-1">
            <small>{t('home.aboutEyebrow')}</small>
            <strong>{t('home.aboutTitle')}</strong>
          </span>
          <ArrowUpRight className="h-4 w-4 text-fg-muted rtl:-scale-x-100" />
        </Link>
      </section>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/map"
            element={
              <Suspense fallback={<RouteFallback />}>
                <MapPage />
              </Suspense>
            }
          />
          <Route
            path="/roadmaps"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RoadmapsPage />
              </Suspense>
            }
          />
          <Route
            path="/roadmaps/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RoadmapDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/compare"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ComparePage />
              </Suspense>
            }
          />
          <Route
            path="/compare/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ComparePage />
              </Suspense>
            }
          />
          <Route
            path="/curves"
            element={
              <Suspense fallback={<RouteFallback />}>
                <CurvesPage />
              </Suspense>
            }
          />
          <Route
            path="/pipelines"
            element={
              <Suspense fallback={<RouteFallback />}>
                <PipelinesPage />
              </Suspense>
            }
          />
          <Route
            path="/pipelines/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <PipelineDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/knowledge"
            element={
              <Suspense fallback={<RouteFallback />}>
                <KnowledgePage />
              </Suspense>
            }
          />
          <Route
            path="/knowledge/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <KnowledgeDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/decisions"
            element={
              <Suspense fallback={<RouteFallback />}>
                <DecisionsPage />
              </Suspense>
            }
          />
          <Route
            path="/decisions/:id"
            element={
              <Suspense fallback={<RouteFallback />}>
                <DecisionsDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/search"
            element={
              <Suspense fallback={<RouteFallback />}>
                <SearchPage />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<RouteFallback />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path="/login"
            element={
              <Suspense fallback={<RouteFallback />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
