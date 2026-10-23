import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { roadmapProgress, roadmapStatus, type RoadmapSeed } from '../data/roadmaps';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import { KIND_ICON, KIND_TONE } from '../lib/roadmapMeta';
import { KindBadge, StatusBadge } from './RoadmapBadges';
import { RoadmapTrail } from './RoadmapTrail';

export function RoadmapCard({ roadmap }: { roadmap: RoadmapSeed }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const progress = roadmapProgress(roadmap);
  const tone = KIND_TONE[roadmap.kind];
  const Icon = KIND_ICON[roadmap.kind];
  const title = localize(roadmap.title, lang);

  return (
    <article className="roadmap-card roadmap-card--map" data-tone={tone}>
      <div className="flex items-start justify-between gap-3">
        <span className={`roadmap-icon tone-${tone}`}>
          <Icon aria-hidden="true" />
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={roadmapStatus(roadmap)} />
          <ArrowUpRight className="h-4 w-4 text-fg-muted rtl:-scale-x-100" aria-hidden="true" />
        </div>
      </div>
      <h3 className="mt-5 font-bold">{title}</h3>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs text-fg-muted">
        {localize(roadmap.description, lang)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <KindBadge kind={roadmap.kind} />
        <span className="text-xs text-fg-muted">
          {t('roadmaps.steps', { value: roadmap.steps.length })}
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
          {t('roadmaps.route')}
        </span>
        <strong className="text-xs">{progress}%</strong>
      </div>
      <RoadmapTrail total={roadmap.steps.length} progress={progress} tone={tone} />
      <p className="mt-2 text-xs text-fg-muted">
        {t('roadmaps.updated', { date: formatDate(roadmap.updatedAt, lang) })}
      </p>
      <Link
        to={`/roadmaps/${roadmap.id}`}
        className="stretched-link"
        aria-label={`${t('roadmaps.open')} ${title}`}
      />
    </article>
  );
}
