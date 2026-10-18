import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { roadmapProgress, roadmapStatus, type RoadmapSeed } from '../data/roadmaps';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import { KIND_ICON, KIND_TONE } from '../lib/roadmapMeta';
import { KindBadge, StatusBadge } from './RoadmapBadges';

export function RoadmapCard({ roadmap }: { roadmap: RoadmapSeed }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const progress = roadmapProgress(roadmap);
  const tone = KIND_TONE[roadmap.kind];
  const Icon = KIND_ICON[roadmap.kind];
  const title = localize(roadmap.title, lang);

  return (
    <article className="roadmap-card">
      <div className="flex items-start justify-between gap-3">
        <span className={`roadmap-icon tone-${tone}`}>
          <Icon aria-hidden="true" />
        </span>
        <StatusBadge status={roadmapStatus(roadmap)} />
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
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-fg-muted">
          {t('roadmaps.updated', { date: formatDate(roadmap.updatedAt, lang) })}
        </span>
        <strong>{progress}%</strong>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-active">
        <div
          className={`h-full rounded-full tone-fill-${tone}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <Link
        to={`/roadmaps/${roadmap.id}`}
        className="stretched-link"
        aria-label={`${t('roadmaps.open')} ${title}`}
      >
        <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
      </Link>
    </article>
  );
}
