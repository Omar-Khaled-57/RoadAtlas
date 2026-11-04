import { ArrowUpRight, LoaderCircle, Plus, Workflow } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useNavigate } from 'react-router-dom';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import { currentStage, roadmapProgress, roadmapStatus } from '../data/roadmaps';
import { useRoadmapGraph, type RoadmapView } from '../data/roadmapGraph';
import { StatusBadge } from '../components/RoadmapBadges';
import { Dialog } from '../components/Dialog';
import { useCreateRoadmap, useSession } from '../data/queries';

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

export function PipelinesPage() {
  usePageMeta({ titleKey: 'seo.pipelines.title', descriptionKey: 'seo.pipelines.description' });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { roadmaps, isLoading } = useRoadmapGraph();
  const pipelines = roadmaps.filter((roadmap) => roadmap.kind === 'pipeline');
  const { data: session } = useSession();
  const createRoadmap = useCreateRoadmap();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    titleAr: '',
    visibility: 'private' as 'public' | 'private',
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    createRoadmap.mutate(
      {
        title: draft.titleAr.trim()
          ? { en: draft.title.trim(), ar: draft.titleAr.trim() }
          : { en: draft.title.trim() },
        kind: 'pipeline',
        visibility: draft.visibility,
        order: pipelines.length,
        topics: [],
        steps: [],
      },
      {
        onSuccess: (roadmap) => {
          setDialogOpen(false);
          setDraft({ title: '', titleAr: '', visibility: 'private' });
          navigate(`/roadmaps/${roadmap.id}`);
        },
      },
    );
  }

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('pipelines.eyebrow')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('pipelines.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('pipelines.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {session?.authenticated ? (
            <>
              <button
                type="button"
                className="primary-button"
                disabled={createRoadmap.isPending}
                onClick={() => setDialogOpen(true)}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                {createRoadmap.isPending
                  ? t('workspace.form.creating')
                  : t('pipelines.newPipeline')}
              </button>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              {t('pipelines.count', { value: pipelines.length })}
            </p>
          )}
        </div>
      </header>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDraft({ title: '', titleAr: '', visibility: 'private' });
        }}
        titleKey="pipelines.newPipeline"
      >
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <label htmlFor="pipe-title-en" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleEn')}
            </label>
            <input
              id="pipe-title-en"
              name="title"
              required
              maxLength={300}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className={INPUT_CLASS}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="pipe-title-ar" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleAr')}
            </label>
            <input
              id="pipe-title-ar"
              name="titleAr"
              dir="rtl"
              maxLength={300}
              value={draft.titleAr}
              onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="pipe-visibility" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.visibility')}
            </label>
            <select
              id="pipe-visibility"
              name="visibility"
              value={draft.visibility}
              onChange={(event) =>
                setDraft({ ...draft, visibility: event.target.value as 'public' | 'private' })
              }
              className={INPUT_CLASS}
            >
              <option value="private">{t('workspace.visibility.private')}</option>
              <option value="public">{t('workspace.visibility.public')}</option>
            </select>
          </div>
          {createRoadmap.isError ? (
            <p role="alert" className="text-sm text-error">
              {t('workspace.createError')}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createRoadmap.isPending || !draft.title.trim()}
              className="primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createRoadmap.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {createRoadmap.isPending ? t('workspace.form.creating') : t('workspace.form.create')}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setDialogOpen(false);
                setDraft({ title: '', titleAr: '', visibility: 'private' });
              }}
            >
              {t('workspace.form.cancel')}
            </button>
          </div>
        </form>
      </Dialog>

      {isLoading ? (
        <p role="status" className="text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      ) : pipelines.length > 0 ? (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {pipelines.map((pipeline) => (
            <li key={pipeline.id}>
              <PipelineCard roadmap={pipeline} lang={lang} />
            </li>
          ))}
        </ul>
      ) : (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-success-soft text-success">
            <Workflow aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold">{t('pipelines.notFound.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {t('pipelines.notFound.body')}
          </p>
          <Link to="/roadmaps" className="primary-button mt-5">
            {t('pipelines.notFound.cta')}
          </Link>
        </section>
      )}
    </div>
  );
}

function PipelineCard({ roadmap, lang }: { roadmap: RoadmapView; lang: string }) {
  const { t } = useTranslation();
  const progress = roadmapProgress(roadmap);
  const stage = currentStage(roadmap);
  const title = localize(roadmap.title, lang);

  return (
    <article className="roadmap-card roadmap-card--pipeline">
      <div className="flex items-start justify-between gap-3">
        <span className="roadmap-icon tone-success">
          <Workflow aria-hidden="true" />
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={roadmapStatus(roadmap)} />
          <ArrowUpRight className="h-4 w-4 text-fg-muted rtl:-scale-x-100" aria-hidden="true" />
        </div>
      </div>
      <h2 className="mt-5 font-bold">{title}</h2>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs text-fg-muted">
        {localize(roadmap.description, lang)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {stage ? (
          <span className="kind-badge kind-badge--pipeline">
            <span className="kind-badge__dot" aria-hidden="true" />
            {t('pipelines.currentStage')}: {t(`roadmaps.stage.${stage}`)}
          </span>
        ) : null}
        <span className="text-xs text-fg-muted">
          {t('roadmaps.steps', { value: roadmap.steps.length })}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-fg-muted">
          {t('pipelines.updated', { date: formatDate(roadmap.updatedAt, lang) })}
        </span>
        <strong>{progress}%</strong>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-active">
        <div className="h-full rounded-full tone-fill-success" style={{ width: `${progress}%` }} />
      </div>
      <Link
        to={`/pipelines/${roadmap.id}`}
        className="stretched-link"
        aria-label={`${t('pipelines.open')} ${title}`}
      />
    </article>
  );
}
