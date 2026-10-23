import { ArrowDownLeft, Check, Circle, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useParams } from 'react-router-dom';
import { ProgressRing } from '../components/ProgressRing';
import { StatusBadge } from '../components/RoadmapBadges';
import {
  PIPELINE_STAGES,
  currentStage,
  getRoadmap,
  roadmapProgress,
  roadmapStatus,
  stageSteps,
  type RoadmapSeed,
  type RoadmapStep,
} from '../data/roadmaps';
import { localize } from '../lib/localize';
import type { PipelineStage } from '@shared/index';

export function PipelineDetailPage() {
  usePageMeta({
    titleKey: 'seo.pipelineDetail.title',
    descriptionKey: 'seo.pipelineDetail.description',
  });
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const lang = i18n.language;
  const roadmap = getRoadmap(id);

  if (!roadmap || roadmap.kind !== 'pipeline') {
    return (
      <div className="page-enter space-y-6">
        <BackLink />
        <section className="surface-card p-10 text-center">
          <h1 className="text-2xl font-bold">{t('pipelines.notFound.title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {t('pipelines.notFound.body')}
          </p>
          <Link to="/pipelines" className="primary-button mt-5">
            {t('pipelines.notFound.cta')}
          </Link>
        </section>
      </div>
    );
  }

  const progress = roadmapProgress(roadmap);
  const status = roadmapStatus(roadmap);
  const stage = currentStage(roadmap);

  return (
    <div className="page-enter space-y-6">
      <BackLink />

      <header className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="roadmap-icon tone-success">
                <Workflow aria-hidden="true" />
              </span>
              <StatusBadge status={status} />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">
              {localize(roadmap.title, lang)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-fg-secondary">
              {localize(roadmap.description, lang)}
            </p>
          </div>
          <ProgressRing
            value={progress}
            label={t('roadmaps.progressLabel')}
            caption={t('roadmaps.progress', { value: progress })}
          />
        </div>
      </header>

      <StageTimeline roadmap={roadmap} stage={stage} />

      <section className="surface-card p-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-bold">{t('pipelines.stepsTitle')}</h2>
          <p className="text-xs text-fg-muted">
            {t('roadmaps.steps', { value: roadmap.steps.length })}
          </p>
        </div>
        {roadmap.steps.length > 0 ? (
          <div className="mt-5 space-y-6">
            {PIPELINE_STAGES.map((s) => {
              const steps = stageSteps(roadmap, s);
              if (steps.length === 0) return null;
              return (
                <div key={s}>
                  <h3 className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
                    {t(`roadmaps.stage.${s}`)}
                  </h3>
                  <ol className="mt-3 list-none space-y-3 p-0">
                    {steps.map((step) => (
                      <StepItem key={step.id} step={step} lang={lang} />
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{t('pipelines.noSteps')}</p>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/pipelines"
      className="inline-flex min-h-6 items-center gap-2 text-sm text-fg-muted hover:text-fg-primary"
    >
      <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
      {t('pipelines.backToList')}
    </Link>
  );
}

function StageTimeline({ roadmap, stage }: { roadmap: RoadmapSeed; stage?: PipelineStage }) {
  const { t } = useTranslation();
  const currentIndex = stage ? PIPELINE_STAGES.indexOf(stage) : -1;

  return (
    <section className="surface-card p-6">
      <h2 className="text-lg font-bold">{t('pipelines.timeline')}</h2>
      <ol className="mt-5 flex list-none flex-col gap-4 p-0 sm:flex-row sm:items-start sm:gap-2">
        {PIPELINE_STAGES.map((s, index) => {
          const steps = stageSteps(roadmap, s);
          const doneCount = steps.filter((step) => step.done).length;
          const isCurrent = index === currentIndex;
          const isDone =
            index < currentIndex ||
            (currentIndex >= 0 && doneCount === steps.length && steps.length > 0);
          const state = isCurrent ? 'current' : isDone ? 'done' : 'upcoming';
          const stateLabel =
            state === 'done'
              ? t('pipelines.stageDone')
              : state === 'current'
                ? t('pipelines.stageCurrent')
                : t('pipelines.stageUpcoming');
          return (
            <li
              key={s}
              className="flex flex-1 items-center gap-3 sm:flex-col sm:items-stretch"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center gap-2 sm:w-full">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                    state === 'done'
                      ? 'border-success bg-success-soft text-success'
                      : state === 'current'
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border-default bg-surface text-fg-muted'
                  }`}
                  aria-hidden="true"
                >
                  {state === 'done' ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                {index < PIPELINE_STAGES.length - 1 ? (
                  <span
                    className="hidden h-px flex-1 bg-border-subtle sm:block"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <div className="sm:mt-2">
                <p className="text-sm font-semibold">{t(`roadmaps.stage.${s}`)}</p>
                <p className="text-xs text-fg-muted">
                  {stateLabel}
                  {steps.length > 0 ? ` · ${doneCount}/${steps.length}` : ''}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepItem({ step, lang }: { step: RoadmapStep; lang: string }) {
  const { t } = useTranslation();
  return (
    <li className={`step-item${step.done ? ' is-done' : ''}`}>
      <span className="step-item__marker" aria-hidden="true">
        {step.done ? <Check /> : <Circle />}
      </span>
      <div>
        <p className="font-semibold">{localize(step.title, lang)}</p>
        <span className="sr-only">
          {step.done ? t('roadmaps.status.completed') : t('roadmaps.status.planned')}
        </span>
        {step.note ? (
          <p className="mt-1 text-sm text-fg-muted">{localize(step.note, lang)}</p>
        ) : null}
      </div>
    </li>
  );
}
