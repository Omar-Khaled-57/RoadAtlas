import { ArrowDownLeft, Check, Circle, Settings, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useParams } from 'react-router-dom';
import { ProgressRing } from '../components/ProgressRing';
import { StatusBadge } from '../components/RoadmapBadges';
import { OwnerRoadmapDetail } from '../components/OwnerRoadmapDetail';
import { useSession, useSetStepProgress, useUpdateRoadmap } from '../data/queries';
import { useRoadmapGraph, type RoadmapView } from '../data/roadmapGraph';
import {
  PIPELINE_STAGES,
  currentStage,
  getRoadmap,
  roadmapProgress,
  roadmapStatus,
  stageSteps,
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
  const { data: session } = useSession();
  const { roadmaps, isLoading: graphLoading, isError: graphError } = useRoadmapGraph();
  const updateRoadmap = useUpdateRoadmap();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    titleAr: '',
    description: '',
    status: '' as '' | 'planned' | 'in_progress' | 'finished' | 'paused',
    icon: '',
    image: '',
  });

  const roadmap = getRoadmap(roadmaps, id);

  // Roadmaps the API owns use Mongo ids; the catalogue below uses readable slugs.
  if (!roadmap && id && /^[a-f\d]{24}$/i.test(id)) {
    return <OwnerRoadmapDetail id={id} />;
  }

  if (graphError) {
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

  if (graphLoading || !roadmap || roadmap.kind !== 'pipeline') {
    return (
      <div className="page-enter space-y-6">
        <BackLink />
        <p className="text-sm text-fg-muted">{t('workspace.loading')}</p>
      </div>
    );
  }

  const ownerId = roadmap.ownerId;
  const isOwner = Boolean(session?.authenticated && session.user?.id === ownerId);
  const allowEditing = isOwner;

  const progress = roadmapProgress(roadmap);
  const status = roadmapStatus(roadmap);
  const stage = currentStage(roadmap);

  return (
    <div className="page-enter space-y-6">
      <BackLink />

      {isOwner || allowEditing ? (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-default px-3 py-1 text-xs font-semibold text-fg-muted">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            {t('workspace.ownerControls')}
          </span>
        </div>
      ) : null}

      <header className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="roadmap-icon tone-success">
                <Workflow aria-hidden="true" />
              </span>
              <StatusBadge status={status} />
            </div>
            {allowEditing && !editing ? (
              <button
                type="button"
                className="mt-4 block w-full max-w-3xl text-start"
                onClick={() => {
                  setDraft({
                    title: roadmap.title.en,
                    titleAr: roadmap.title.ar ?? '',
                    description: roadmap.description?.en ?? '',
                    status:
                      (roadmap.status as '' | 'planned' | 'in_progress' | 'finished' | 'paused') ??
                      (roadmap.paused ? 'paused' : ''),
                    icon: roadmap.icon ?? '',
                    image: roadmap.image ?? '',
                  });
                  setEditing(true);
                }}
              >
                <h1 className="text-3xl font-bold tracking-tight hover:text-primary">
                  {localize(roadmap.title, lang)}
                </h1>
              </button>
            ) : allowEditing && editing ? (
              <form
                className="mt-4 grid w-full max-w-3xl gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  updateRoadmap.mutate(
                    {
                      id: roadmap.id,
                      input: {
                        title: draft.titleAr.trim()
                          ? { en: draft.title.trim(), ar: draft.titleAr.trim() }
                          : { en: draft.title.trim() },
                        description: draft.description.trim()
                          ? { en: draft.description.trim() }
                          : null,
                        status: draft.status || undefined,
                        // Keep the legacy flag in sync: leaving it set would keep showing "Paused".
                        paused: draft.status === 'paused' ? true : undefined,
                        icon: draft.icon.trim() || undefined,
                        image: draft.image.trim() || undefined,
                      },
                    },
                    { onSuccess: () => setEditing(false) },
                  );
                }}
              >
                <input
                  name="pipeline-title-en"
                  className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2 text-sm"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder={t('workspace.form.titleEn')}
                />
                <input
                  name="pipeline-title-ar"
                  className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2 text-sm"
                  dir="rtl"
                  value={draft.titleAr}
                  onChange={(e) => setDraft({ ...draft, titleAr: e.target.value })}
                  placeholder={t('workspace.form.titleAr')}
                />
                <textarea
                  name="pipeline-description"
                  className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2 text-sm"
                  rows={5}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder={t('workspace.form.description')}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <select
                    name="pipeline-status"
                    className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2 text-sm"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        status: e.target.value as
                          '' | 'planned' | 'in_progress' | 'finished' | 'paused',
                      })
                    }
                  >
                    <option value="">{t('workspace.form.status')}</option>
                    <option value="planned">{t('workspace.form.statusPlanned')}</option>
                    <option value="in_progress">{t('workspace.form.statusInProgress')}</option>
                    <option value="finished">{t('workspace.form.statusFinished')}</option>
                    <option value="paused">{t('workspace.form.statusPaused')}</option>
                  </select>
                  <input
                    name="pipeline-icon"
                    className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2 text-sm"
                    value={draft.icon}
                    onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                    placeholder={t('workspace.form.icon')}
                  />
                  <input
                    name="pipeline-image"
                    className="w-full rounded-xl border border-border-default bg-surface-solid px-3 py-2 text-sm"
                    value={draft.image}
                    onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                    placeholder={t('workspace.form.image')}
                  />
                </div>
                {updateRoadmap.isError ? (
                  <p role="alert" className="text-sm text-error">
                    {t('workspace.detail.updateError')}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={updateRoadmap.isPending}
                  >
                    {t('common.save')}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditing(false)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <h1 className="mt-4 text-3xl font-bold tracking-tight">
                {localize(roadmap.title, lang)}
              </h1>
            )}
            {!editing ? (
              <p className="mt-3 w-full max-w-4xl text-sm leading-7 text-fg-secondary">
                {localize(roadmap.description, lang)}
              </p>
            ) : null}
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
                      <StepItem
                        key={step.id}
                        step={step}
                        lang={lang}
                        isOwner={allowEditing}
                        roadmapId={roadmap.id}
                      />
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

function StageTimeline({ roadmap, stage }: { roadmap: RoadmapView; stage?: PipelineStage }) {
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

function StepItem({
  step,
  lang,
  isOwner,
  roadmapId,
}: {
  step: RoadmapStep;
  lang: string;
  isOwner?: boolean;
  roadmapId: string;
}) {
  const { t } = useTranslation();
  const setProgress = useSetStepProgress();
  const done = Boolean(step.done);
  return (
    <li className={`step-item${done ? ' is-done' : ''}`}>
      <span className="step-item__marker" aria-hidden="true">
        {done ? <Check /> : <Circle />}
      </span>
      <div className="w-full">
        <p className="font-semibold">{localize(step.title, lang)}</p>
        <span className="sr-only">
          {done ? t('roadmaps.status.completed') : t('roadmaps.status.planned')}
        </span>
        {step.note ? (
          <p className="mt-1 text-sm text-fg-muted">{localize(step.note, lang)}</p>
        ) : null}
        {isOwner ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="secondary-button"
              disabled={setProgress.isPending}
              onClick={() =>
                setProgress.mutate({
                  roadmapId,
                  stepId: step.id,
                  done: !done,
                  status: done ? 'in_progress' : 'done',
                })
              }
            >
              {done ? t('workspace.detail.markTodo') : t('workspace.detail.markDone')}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={setProgress.isPending}
              onClick={() =>
                setProgress.mutate({
                  roadmapId,
                  stepId: step.id,
                  status: 'in_progress',
                  done: false,
                })
              }
            >
              {t('workspace.detail.stepInProgress')}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={setProgress.isPending}
              onClick={() =>
                setProgress.mutate({ roadmapId, stepId: step.id, status: 'done', done: true })
              }
            >
              {t('workspace.detail.stepDone')}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={setProgress.isPending}
              onClick={() =>
                setProgress.mutate({ roadmapId, stepId: step.id, status: 'revisit', done: false })
              }
            >
              {t('workspace.detail.stepRevisit')}
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
