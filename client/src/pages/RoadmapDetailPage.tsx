import { ArrowDownLeft, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useParams } from 'react-router-dom';
import { ProgressRing } from '../components/ProgressRing';
import { KindBadge, StatusBadge } from '../components/RoadmapBadges';
import { OwnerRoadmapDetail } from '../components/OwnerRoadmapDetail';
import { RoadmapCard } from '../components/RoadmapCard';
import { useSession } from '../data/queries';
import { useRoadmapGraph } from '../data/roadmapGraph';
import {
  childRoadmaps,
  getRoadmap,
  roadmapProgress,
  roadmapStatus,
  type RoadmapStep,
} from '../data/roadmaps';
import { localize } from '../lib/localize';
import { KIND_ICON, KIND_TONE } from '../lib/roadmapMeta';

export function RoadmapDetailPage() {
  usePageMeta({
    titleKey: 'seo.roadmapDetail.title',
    descriptionKey: 'seo.roadmapDetail.description',
  });
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const { roadmaps, isLoading: graphLoading, isError: graphError } = useRoadmapGraph();

  // Roadmaps the API owns use Mongo ids; the catalogue below uses readable slugs.
  const roadmap = getRoadmap(roadmaps, id);
  const isOwner = Boolean(
    authenticated && roadmap?.ownerId && roadmap.ownerId === session?.user?.id,
  );
  // Owners get the editable detail view; visitors get the read-only public page.
  // A Mongo id that the public graph cannot resolve (private or unpublished) also
  // falls through to the owner view, which reports its own not-found state.
  if (id && /^[a-f\d]{24}$/i.test(id) && (isOwner || !roadmap)) {
    return <OwnerRoadmapDetail id={id} />;
  }

  if (graphError) {
    return (
      <div className="page-enter space-y-6">
        <BackLink />
        <section className="surface-card p-10 text-center">
          <h1 className="text-2xl font-bold">{t('roadmaps.notFound.title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {t('roadmaps.notFound.body')}
          </p>
          <Link to="/roadmaps" className="primary-button mt-5">
            {t('roadmaps.notFound.cta')}
          </Link>
        </section>
      </div>
    );
  }

  if (graphLoading || !roadmap) {
    return (
      <div className="page-enter space-y-6">
        <BackLink />
        <p className="text-sm text-fg-muted">{t('workspace.loading')}</p>
      </div>
    );
  }

  const progress = roadmapProgress(roadmap);
  const status = roadmapStatus(roadmap);
  const tone = KIND_TONE[roadmap.kind];
  const Icon = KIND_ICON[roadmap.kind];
  const parent = getRoadmap(roadmaps, roadmap.parentId);
  const children = childRoadmaps(roadmaps, roadmap.id);
  const currentIndex = roadmap.steps.findIndex((step) => !step.done);

  return (
    <div className="page-enter space-y-6">
      <BackLink />

      <header className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className={`roadmap-icon tone-${tone}`}>
                <Icon aria-hidden="true" />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <KindBadge kind={roadmap.kind} />
                <StatusBadge status={status} />
              </div>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              {localize(roadmap.title, lang)}
            </h1>
            {parent ? (
              <p className="mt-2 text-sm text-fg-muted">
                {t('roadmaps.partOf')}{' '}
                <Link
                  to={`/roadmaps/${parent.id}`}
                  className="font-semibold text-primary hover:text-primary-hover"
                >
                  {localize(parent.title, lang)}
                </Link>
              </p>
            ) : null}
          </div>
          {authenticated && roadmap.steps.some((s) => 'done' in s) && (
            <ProgressRing
              value={progress}
              label={t('roadmaps.progressLabel')}
              caption={t('roadmaps.progress', { value: progress })}
            />
          )}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="surface-card p-6">
          <h2 className="text-lg font-bold">{t('roadmaps.overview')}</h2>
          <p className="mt-3 text-sm leading-6 text-fg-secondary">
            {localize(roadmap.description ?? roadmap.title, lang)}
          </p>
          {roadmap.topics.length > 0 ? (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-fg-muted">
                {t('roadmaps.topics')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roadmap.topics.map((topic) => (
                  <span key={topic.en} className="topic-chip">
                    {localize(topic, lang)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </article>

        <article className="surface-card p-6">
          <h2 className="text-lg font-bold">{t('roadmaps.prerequisites')}</h2>
          {roadmap.prerequisites.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {roadmap.prerequisites.map((item) => (
                <li key={item.en} className="flex items-start gap-2 text-sm text-fg-secondary">
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted rtl:-scale-x-100"
                  />
                  {localize(item, lang)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">{t('roadmaps.noPrerequisites')}</p>
          )}
        </article>
      </section>

      <section className="surface-card p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
              {t('roadmaps.route')}
            </p>
            <h2 className="mt-1 text-lg font-bold">{t('roadmaps.stepsTitle')}</h2>
          </div>
          <p className="text-xs text-fg-muted">
            {t('roadmaps.steps', { value: roadmap.steps.length })}
          </p>
        </div>
        {roadmap.steps.length > 0 ? (
          <ol className="route-list mt-5 list-none p-0">
            {roadmap.steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                total={roadmap.steps.length}
                current={authenticated && index === currentIndex}
                lang={lang}
              />
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{t('roadmaps.noSteps')}</p>
        )}
      </section>

      {children.length > 0 ? (
        <section className="surface-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t('roadmaps.branch')}</h2>
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <li key={child.id}>
                <RoadmapCard roadmap={child} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function BackLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/roadmaps"
      className="inline-flex min-h-6 items-center gap-2 text-sm text-fg-muted hover:text-fg-primary"
    >
      <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
      {t('roadmaps.backToCatalog')}
    </Link>
  );
}

interface StepItemProps {
  step: RoadmapStep;
  index: number;
  total: number;
  current: boolean;
  lang: string;
}

function StepItem({ step, index, total, current, lang }: StepItemProps) {
  const { t } = useTranslation();
  return (
    <li className={`route-stop${step.done ? ' is-done' : ''}${current ? ' is-current' : ''}`}>
      <span className="route-stop__marker" aria-hidden="true">
        {step.done ? <Check /> : <span className="route-stop__number">{index + 1}</span>}
      </span>
      <div className="route-stop__body">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">{t('roadmaps.stepIndex', { current: index + 1, total })}</span>
          <h3 className="font-semibold">{localize(step.title, lang)}</h3>
          {step.stage ? (
            <span className="stage-badge">{t(`roadmaps.stage.${step.stage}`)}</span>
          ) : null}
          {current ? <span className="next-stop-chip">{t('roadmaps.nextStop')}</span> : null}
          <span className="sr-only">
            {step.done ? t('roadmaps.stepDone') : t('roadmaps.stepTodo')}
          </span>
        </div>
        {step.description ? (
          <p className="mt-1 text-sm text-fg-muted">{localize(step.description, lang)}</p>
        ) : null}
        {step.note ? <p className="step-item__note">{localize(step.note, lang)}</p> : null}
        {step.resources.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {step.resources.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm font-semibold text-primary hover:text-primary-hover"
                >
                  {resource.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}
