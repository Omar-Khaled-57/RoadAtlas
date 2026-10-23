import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Plus, Workflow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link } from 'react-router-dom';
import type { AuthSession } from '@shared/index';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import {
  currentStage,
  pipelineRoadmaps,
  roadmapProgress,
  roadmapStatus,
  type RoadmapSeed,
} from '../data/roadmaps';
import { StatusBadge } from '../components/RoadmapBadges';

export function PipelinesPage() {
  usePageMeta({ titleKey: 'seo.pipelines.title', descriptionKey: 'seo.pipelines.description' });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const pipelines = pipelineRoadmaps();
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => (await api.get<AuthSession>('/api/auth/session')).data,
    retry: false,
  });

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
              <button type="button" className="primary-button" disabled aria-describedby="new-note">
                <Plus aria-hidden="true" className="h-4 w-4" />
                {t('pipelines.newPipeline')}
              </button>
              <span id="new-note" className="text-xs text-fg-muted">
                {t('pipelines.newUnavailable')}
              </span>
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              {t('pipelines.count', { value: pipelines.length })}
            </p>
          )}
        </div>
      </header>

      {pipelines.length > 0 ? (
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

function PipelineCard({ roadmap, lang }: { roadmap: RoadmapSeed; lang: string }) {
  const { t } = useTranslation();
  const progress = roadmapProgress(roadmap);
  const stage = currentStage(roadmap);
  const title = localize(roadmap.title, lang);

  return (
    <article className="roadmap-card">
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
