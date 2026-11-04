import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft, Check, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { KindBadge } from './RoadmapBadges';
import { ProgressRing } from './ProgressRing';
import {
  useAddStep,
  useDeleteStep,
  useDeleteRoadmap,
  useOwnerRoadmap,
  useSession,
  useRoadmapProgress,
  useRoadmapSteps,
  useSetFocus,
  useSetStepProgress,
  useUpdateRoadmap,
  useUpdateStep,
  useOwnerRoadmaps,
} from '../data/queries';
import { localize } from '../lib/localize';
import { canContain } from '../lib/roadmapMeta';
import { techProfiles } from '../data/techCatalogue';
import type { ID, PipelineStage } from '@shared/index';

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

const STAGES: PipelineStage[] = ['idea', 'design', 'build', 'ship', 'done'];

/** Detail view for a roadmap the API owns: steps, progress and owner actions. */
export function OwnerRoadmapDetail({ id }: { id: ID }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const navigate = useNavigate();
  const { data: session } = useSession();

  const roadmap = useOwnerRoadmap(id);
  const steps = useRoadmapSteps(id);
  const isOwner = Boolean(session?.authenticated && session.user?.id === roadmap.data?.ownerId);
  const allRoadmaps = useOwnerRoadmaps(isOwner);
  const progress = useRoadmapProgress(id, isOwner);
  const setProgress = useSetStepProgress();
  const addStep = useAddStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const updateRoadmap = useUpdateRoadmap();
  const removeRoadmap = useDeleteRoadmap();

  const setFocus = useSetFocus();
  const [stepTitle, setStepTitle] = useState('');
  const [stepStage, setStepStage] = useState<PipelineStage | ''>('');
  const [editingStep, setEditingStep] = useState<ID | null>(null);
  const [stepDraft, setStepDraft] = useState({
    title: '',
    titleAr: '',
    stage: '' as PipelineStage | '',
  });
  const [editingRoadmap, setEditingRoadmap] = useState(false);
  const [roadmapDraft, setRoadmapDraft] = useState({
    title: '',
    titleAr: '',
    description: '',
    parentId: '',
    techId: '',
    topics: '',
    status: '' as '' | 'planned' | 'in_progress' | 'finished' | 'paused',
    paused: false,
    icon: '',
    image: '',
  });
  const [confirming, setConfirming] = useState(false);
  const recorded = useRef<string | null>(null);

  // Opening an owned roadmap records it as the owner's last visit, once per id.
  useEffect(() => {
    if (!isOwner || !roadmap.data || recorded.current === id) return;
    recorded.current = id;
    setFocus.mutate({ lastVisited: { roadmapId: id, at: new Date().toISOString() } });
  }, [id, isOwner, roadmap.data, setFocus]);

  useEffect(() => {
    if (!steps.data || !window.location.hash.startsWith('#step-')) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({
        block: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [steps.data]);

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
  const currentStepId = isOwner ? stepItems.find((step) => !doneIds.has(step.id))?.id : undefined;
  const childRoadmaps = (allRoadmaps.data ?? []).filter((candidate) => candidate.parentId === id);

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

  function submitRoadmap(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateRoadmap.mutate(
      {
        id,
        input: {
          title: roadmapDraft.titleAr.trim()
            ? { en: roadmapDraft.title.trim(), ar: roadmapDraft.titleAr.trim() }
            : { en: roadmapDraft.title.trim() },
          description: roadmapDraft.description.trim()
            ? { en: roadmapDraft.description.trim() }
            : null,
          parentId: roadmapDraft.parentId || null,
          ...(item.kind === 'tech' ? { techId: roadmapDraft.techId.trim() || null } : {}),
          topics: roadmapDraft.topics
            .split(',')
            .map((topic) => topic.trim())
            .filter(Boolean),
          status: roadmapDraft.status || undefined,
          // Keep the legacy flag in sync: leaving it set would keep showing "Paused".
          paused: roadmapDraft.status === 'paused',
          icon: roadmapDraft.icon.trim() || undefined,
          image: roadmapDraft.image.trim() || undefined,
          revision: item.revision ?? 0,
        },
      },
      { onSuccess: () => setEditingRoadmap(false) },
    );
  }

  function beginEditRoadmap() {
    const roadmapItem = item as typeof item & { status?: string; icon?: string; image?: string };
    setRoadmapDraft({
      title: item.title.en,
      titleAr: item.title.ar ?? '',
      description: item.description?.en ?? '',
      parentId: item.parentId ?? '',
      techId: item.techId ?? '',
      topics: (item.topics ?? []).join(', '),
      status:
        (roadmapItem.status as '' | 'planned' | 'in_progress' | 'finished' | 'paused') ??
        (roadmapItem.paused ? 'paused' : ''),
      paused: Boolean(roadmapItem.paused),
      icon: roadmapItem.icon ?? '',
      image: roadmapItem.image ?? '',
    });
    setEditingRoadmap(true);
  }

  function beginEditStep(step: (typeof stepItems)[number]) {
    setEditingStep(step.id);
    setStepDraft({ title: step.title.en, titleAr: step.title.ar ?? '', stage: step.stage ?? '' });
  }

  function submitStepEdit(
    event: React.FormEvent<HTMLFormElement>,
    step: (typeof stepItems)[number],
  ) {
    event.preventDefault();
    updateStep.mutate(
      {
        id: step.id,
        roadmapId: id,
        input: {
          title: stepDraft.titleAr.trim()
            ? { en: stepDraft.title.trim(), ar: stepDraft.titleAr.trim() }
            : { en: stepDraft.title.trim() },
          stage: stepDraft.stage || null,
          revision: step.revision ?? 0,
        },
      },
      { onSuccess: () => setEditingStep(null) },
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
          {isOwner ? (
            <ProgressRing
              value={percent}
              label={t('roadmaps.progressLabel')}
              caption={t('roadmaps.progress', { value: percent })}
            />
          ) : null}
        </div>

        {isOwner ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" className="secondary-button" onClick={beginEditRoadmap}>
              {t('common.edit')}
            </button>
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
              <button
                type="button"
                className="secondary-button"
                onClick={() => setConfirming(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t('workspace.delete')}
              </button>
            )}
          </div>
        ) : null}
        {isOwner && editingRoadmap ? (
          <form
            onSubmit={submitRoadmap}
            className="mt-5 grid gap-3 border-t border-border-subtle pt-5"
          >
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleEn')}
              <input
                name="roadmap-title-en"
                required
                value={roadmapDraft.title}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, title: e.target.value })}
                className={INPUT_CLASS}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleAr')}
              <input
                name="roadmap-title-ar"
                dir="rtl"
                value={roadmapDraft.titleAr}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, titleAr: e.target.value })}
                className={INPUT_CLASS}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.description')}
              <textarea
                name="roadmap-description"
                rows={3}
                value={roadmapDraft.description}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, description: e.target.value })}
                className={INPUT_CLASS}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.parent')}
              <select
                name="roadmap-parent"
                value={roadmapDraft.parentId}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, parentId: e.target.value })}
                className={INPUT_CLASS}
              >
                <option value="">{t('workspace.form.noParent')}</option>
                {(allRoadmaps.data ?? [])
                  .filter(
                    (candidate) => candidate.id !== id && canContain(candidate.kind, item.kind),
                  )
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {localize(candidate.title, lang)}
                    </option>
                  ))}
              </select>
            </label>
            {item.kind === 'tech' ? (
              <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
                {t('workspace.form.tech')}
                <select
                  name="roadmap-tech"
                  value={roadmapDraft.techId}
                  onChange={(e) => setRoadmapDraft({ ...roadmapDraft, techId: e.target.value })}
                  className={INPUT_CLASS}
                >
                  <option value="">{t('workspace.form.techNone')}</option>
                  {techProfiles.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {localize(tech.name, lang)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.status')}
              <select
                name="roadmap-status"
                value={roadmapDraft.status}
                onChange={(e) =>
                  setRoadmapDraft({
                    ...roadmapDraft,
                    status: e.target.value as
                      '' | 'planned' | 'in_progress' | 'finished' | 'paused',
                  })
                }
                className={INPUT_CLASS}
              >
                <option value="">{t('workspace.form.statusNone')}</option>
                <option value="planned">{t('workspace.form.statusPlanned')}</option>
                <option value="in_progress">{t('workspace.form.statusInProgress')}</option>
                <option value="finished">{t('workspace.form.statusFinished')}</option>
                <option value="paused">{t('workspace.form.statusPaused')}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.icon')}
              <input
                name="roadmap-icon"
                value={roadmapDraft.icon}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, icon: e.target.value })}
                className={INPUT_CLASS}
                placeholder={t('workspace.form.iconPlaceholder')}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.image')}
              <input
                name="roadmap-image"
                value={roadmapDraft.image}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, image: e.target.value })}
                className={INPUT_CLASS}
                placeholder={t('workspace.form.imagePlaceholder')}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-fg-secondary">
              {t('workspace.form.topics')}
              <input
                name="roadmap-topics"
                value={roadmapDraft.topics}
                onChange={(e) => setRoadmapDraft({ ...roadmapDraft, topics: e.target.value })}
                className={INPUT_CLASS}
                placeholder={t('workspace.form.topicsHint')}
              />
            </label>
            {updateRoadmap.isError ? (
              <p role="alert" className="text-sm text-error">
                {t('workspace.detail.updateError')}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateRoadmap.isPending || !roadmapDraft.title.trim()}
                className="primary-button"
              >
                {t('common.save')}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingRoadmap(false)}
              >
                {t('workspace.form.cancel')}
              </button>
            </div>
          </form>
        ) : null}
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
                  id={`step-${step.id}`}
                  tabIndex={-1}
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
                    {isOwner ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          aria-pressed={done}
                          className="secondary-button"
                          disabled={setProgress.isPending}
                          onClick={() =>
                            setProgress.mutate({
                              roadmapId: id,
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
                              roadmapId: id,
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
                            setProgress.mutate({
                              roadmapId: id,
                              stepId: step.id,
                              status: 'partially_done',
                              done: false,
                            })
                          }
                        >
                          {t('workspace.detail.stepPartiallyDone')}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={setProgress.isPending}
                          onClick={() =>
                            setProgress.mutate({
                              roadmapId: id,
                              stepId: step.id,
                              status: 'revisit',
                              done: false,
                            })
                          }
                        >
                          {t('workspace.detail.stepRevisit')}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={setProgress.isPending}
                          onClick={() =>
                            setProgress.mutate({
                              roadmapId: id,
                              stepId: step.id,
                              status: 'test',
                              done: false,
                            })
                          }
                        >
                          {t('workspace.detail.stepTest')}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={setProgress.isPending}
                          onClick={() =>
                            setProgress.mutate({
                              roadmapId: id,
                              stepId: step.id,
                              status: 'revise',
                              done: false,
                            })
                          }
                        >
                          {t('workspace.detail.stepRevise')}
                        </button>
                      </div>
                    ) : null}
                    {isOwner && editingStep === step.id ? (
                      <form
                        onSubmit={(event) => submitStepEdit(event, step)}
                        className="mt-3 grid gap-2"
                      >
                        <input
                          name={`step-${step.id}-title-en`}
                          aria-label={t('workspace.form.titleEn')}
                          required
                          value={stepDraft.title}
                          onChange={(e) => setStepDraft({ ...stepDraft, title: e.target.value })}
                          className={INPUT_CLASS}
                        />
                        <input
                          name={`step-${step.id}-title-ar`}
                          aria-label={t('workspace.form.titleAr')}
                          dir="rtl"
                          value={stepDraft.titleAr}
                          onChange={(e) => setStepDraft({ ...stepDraft, titleAr: e.target.value })}
                          className={INPUT_CLASS}
                        />
                        <select
                          name={`step-${step.id}-stage`}
                          aria-label={t('workspace.detail.stepStage')}
                          value={stepDraft.stage}
                          onChange={(e) =>
                            setStepDraft({
                              ...stepDraft,
                              stage: e.target.value as PipelineStage | '',
                            })
                          }
                          className={INPUT_CLASS}
                        >
                          <option value="">{t('workspace.detail.noStage')}</option>
                          {STAGES.map((stage) => (
                            <option key={stage} value={stage}>
                              {t(`roadmaps.stage.${stage}`)}
                            </option>
                          ))}
                        </select>
                        {updateStep.isError ? (
                          <p role="alert" className="text-sm text-error">
                            {t('workspace.detail.updateError')}
                          </p>
                        ) : null}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={updateStep.isPending || !stepDraft.title.trim()}
                            className="primary-button"
                          >
                            {t('common.save')}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setEditingStep(null)}
                          >
                            {t('workspace.form.cancel')}
                          </button>
                        </div>
                      </form>
                    ) : isOwner ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => beginEditStep(step)}
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={deleteStep.isPending}
                          onClick={() => deleteStep.mutate({ id: step.id, roadmapId: id })}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {t('common.delete')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-fg-muted">{t('workspace.detail.noSteps')}</p>
        )}

        {isOwner ? (
          <form
            onSubmit={submitStep}
            className="mt-6 grid gap-3 border-t border-border-subtle pt-5"
          >
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
        ) : null}
      </section>

      {childRoadmaps.length > 0 ? (
        <section className="surface-card p-6">
          <h2 className="text-lg font-bold">{t('roadmaps.branch')}</h2>
          <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {childRoadmaps.map((child) => (
              <li key={child.id}>
                <Link to={`/roadmaps/${child.id}`} className="secondary-button w-full">
                  {localize(child.title, lang)}
                </Link>
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
