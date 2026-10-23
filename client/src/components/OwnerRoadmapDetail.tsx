import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, Check, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { KindBadge } from './RoadmapBadges';
import { ProgressRing } from './ProgressRing';
import {
  useAddStep,
  useDeleteRoadmap,
  useOwnerRoadmap,
  useRoadmapProgress,
  useRoadmapSteps,
  useSetFocus,
  useSetStepProgress,
  useUpdateRoadmap,
} from '../data/queries';
import { localize } from '../lib/localize';
import type { ID, PipelineStage } from '@shared/index';

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

const STAGES: PipelineStage[] = ['idea', 'design', 'build', 'ship', 'done'];

/** Detail view for a roadmap the API owns: steps, progress and owner actions. */
export function OwnerRoadmapDetail({ id }: { id: ID }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();

  const roadmap = useOwnerRoadmap(id);
  const steps = useRoadmapSteps(id);
  const progress = useRoadmapProgress(id);
  const setProgress = useSetStepProgress();
  const addStep = useAddStep();
  const updateRoadmap = useUpdateRoadmap();
  const removeRoadmap = useDeleteRoadmap();

  const setFocus = useSetFocus();
  const [stepTitle, setStepTitle] = useState('');
  const [stepStage, setStepStage] = useState<PipelineStage | ''>('');
  const [confirming, setConfirming] = useState(false);
  const recorded = useRef<string | null>(null);

  // Opening an owned roadmap records it as the owner's last visit, once per id.
  useEffect(() => {
    if (!roadmap.data || recorded.current === id) return;
    recorded.current = id;
    setFocus.mutate({ lastVisited: { roadmapId: id, at: new Date().toISOString() } });
  }, [id, roadmap.data, setFocus]);

  if (roadmap.isError) {
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

  if (roadmap.isPending || !roadmap.data) {
    return (
      <div className="page-enter space-y-6">
        <BackLink />
        <p className="text-sm text-fg-muted">{t('workspace.loading')}</p>
      </div>
    );
  }

  const item = roadmap.data;
  const stepItems = steps.data ?? [];
  const doneIds = new Set(
    (progress.data ?? []).filter((entry) => entry.done).map((entry) => entry.stepId),
  );
  const percent =
    stepItems.length === 0
      ? 0
      : Math.round(
          (stepItems.filter((step) => doneIds.has(step.id)).length / stepItems.length) * 100,
        );
  const currentStepId = stepItems.find((step) => !doneIds.has(step.id))?.id;

  function submitStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stepTitle.trim()) return;
    addStep.mutate(
      {
        roadmapId: id,
        input: {
          title: { en: stepTitle.trim() },
          ...(stepStage ? { stage: stepStage } : {}),
        },
      },
      { onSuccess: () => setStepTitle('') },
    );
  }

  return (
    <div className="page-enter space-y-6">
      <BackLink />

      <header className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={item.kind} />
              <span className="kind-badge kind-badge--hub">
                <span className="kind-badge__dot" aria-hidden="true" />
                {t(`workspace.visibility.${item.visibility}`)}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">{localize(item.title, lang)}</h1>
            {item.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-secondary">
                {localize(item.description, lang)}
              </p>
            ) : null}
          </div>
          <ProgressRing
            value={percent}
            label={t('roadmaps.progressLabel')}
            caption={t('roadmaps.progress', { value: percent })}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="secondary-button"
            disabled={updateRoadmap.isPending}
            onClick={() =>
              updateRoadmap.mutate({
                id,
                input: { visibility: item.visibility === 'public' ? 'private' : 'public' },
              })
            }
          >
            {item.visibility === 'public'
              ? t('workspace.detail.unpublish')
              : t('workspace.detail.publish')}
          </button>
          {confirming ? (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  removeRoadmap.mutate(id, { onSuccess: () => navigate('/roadmaps') });
                  setConfirming(false);
                }}
              >
                {t('workspace.deleteConfirm')}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirming(false)}
              >
                {t('workspace.deleteCancel')}
              </button>
            </>
          ) : (
            <button type="button" className="secondary-button" onClick={() => setConfirming(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {t('workspace.delete')}
            </button>
          )}
        </div>
      </header>

      <section className="surface-card p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
              {t('roadmaps.route')}
            </p>
            <h2 className="mt-1 text-lg font-bold">{t('workspace.detail.steps')}</h2>
          </div>
          <p className="text-xs text-fg-muted">
            {t('roadmaps.steps', { value: stepItems.length })}
          </p>
        </div>

        {stepItems.length > 0 ? (
          <ol className="route-list mt-5 list-none p-0">
            {stepItems.map((step, index) => {
              const done = doneIds.has(step.id);
              const current = step.id === currentStepId;
              return (
                <li
                  key={step.id}
                  className={`route-stop${done ? ' is-done' : ''}${current ? ' is-current' : ''}`}
                >
                  <span className="route-stop__marker" aria-hidden="true">
                    {done ? <Check /> : <span className="route-stop__number">{index + 1}</span>}
                  </span>
                  <div className="route-stop__body">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="sr-only">
                        {t('roadmaps.stepIndex', { current: index + 1, total: stepItems.length })}
                      </span>
                      <h3 className="font-semibold">{localize(step.title, lang)}</h3>
                      {step.stage ? (
                        <span className="stage-badge">{t(`roadmaps.stage.${step.stage}`)}</span>
                      ) : null}
                      {current ? (
                        <span className="next-stop-chip">{t('roadmaps.nextStop')}</span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-pressed={done}
                      className="secondary-button mt-2"
                      disabled={setProgress.isPending}
                      onClick={() =>
                        setProgress.mutate({ roadmapId: id, stepId: step.id, done: !done })
                      }
                    >
                      {done ? t('workspace.detail.markTodo') : t('workspace.detail.markDone')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{t('workspace.detail.noSteps')}</p>
        )}

        <form onSubmit={submitStep} className="mt-6 grid gap-3 border-t border-border-subtle pt-5">
          <div className="grid gap-2">
            <label htmlFor="step-title" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.detail.stepTitle')}
            </label>
            <input
              id="step-title"
              name="stepTitle"
              required
              maxLength={300}
              value={stepTitle}
              onChange={(event) => setStepTitle(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="step-stage" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.detail.stepStage')}
            </label>
            <select
              id="step-stage"
              name="stepStage"
              value={stepStage}
              onChange={(event) => setStepStage(event.target.value as PipelineStage | '')}
              className={INPUT_CLASS}
            >
              <option value="">{t('workspace.detail.noStage')}</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {t(`roadmaps.stage.${stage}`)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={addStep.isPending || !stepTitle.trim()}
            className="primary-button justify-self-start disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addStep.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {addStep.isPending ? t('workspace.detail.adding') : t('workspace.detail.add')}
          </button>
        </form>
      </section>
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
