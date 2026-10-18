import { Map as MapIcon, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RoadmapCard } from '../components/RoadmapCard';
import { roadmapStatus, seedRoadmaps, type RoadmapStatus } from '../data/roadmaps';
import { KIND_ICON } from '../lib/roadmapMeta';
import type { RoadmapKind } from '@shared/index';

type KindFilter = RoadmapKind | 'all';
type StatusFilter = RoadmapStatus | 'all';

const KIND_FILTERS: KindFilter[] = ['all', 'hub', 'tech', 'pipeline'];
const STATUS_FILTERS: StatusFilter[] = ['all', 'planned', 'in-progress', 'completed', 'paused'];

export function RoadmapsPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const roadmaps = useMemo(
    () =>
      seedRoadmaps.filter(
        (roadmap) =>
          (kind === 'all' || roadmap.kind === kind) &&
          (status === 'all' || roadmapStatus(roadmap) === status),
      ),
    [kind, status],
  );

  const isFiltered = kind !== 'all' || status !== 'all';

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('roadmaps.eyebrow')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('roadmaps.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('roadmaps.subtitle')}</p>
        </div>
        <p className="text-sm text-fg-muted">{t('roadmaps.count', { value: roadmaps.length })}</p>
      </header>

      <section className="surface-card space-y-3 p-4 sm:p-5" aria-label={t('roadmaps.filters')}>
        <FilterRow
          label={t('roadmaps.filterKind')}
          options={KIND_FILTERS}
          value={kind}
          onChange={setKind}
          labelFor={(option) =>
            option === 'all' ? t('roadmaps.all') : t(`roadmaps.kind.${option}`)
          }
          iconFor={(option) => (option === 'all' ? null : KIND_ICON[option])}
        />
        <FilterRow
          label={t('roadmaps.filterStatus')}
          options={STATUS_FILTERS}
          value={status}
          onChange={setStatus}
          labelFor={(option) =>
            option === 'all' ? t('roadmaps.all') : t(`roadmaps.status.${option}`)
          }
        />
      </section>

      {roadmaps.length > 0 ? (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <li key={roadmap.id}>
              <RoadmapCard roadmap={roadmap} />
            </li>
          ))}
        </ul>
      ) : (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-primary-soft text-primary">
            <MapIcon aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">
            {isFiltered ? t('roadmaps.emptyFiltered.title') : t('roadmaps.empty.title')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {isFiltered ? t('roadmaps.emptyFiltered.body') : t('roadmaps.empty.body')}
          </p>
          {isFiltered ? (
            <button
              type="button"
              className="secondary-button mt-5"
              onClick={() => {
                setKind('all');
                setStatus('all');
              }}
            >
              {t('roadmaps.emptyFiltered.cta')}
            </button>
          ) : (
            <Link to="/map" className="primary-button mt-5">
              <MapIcon aria-hidden="true" className="h-4 w-4" />
              {t('roadmaps.empty.cta')}
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

interface FilterRowProps<T extends string> {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  labelFor: (option: T) => string;
  iconFor?: (option: T) => LucideIcon | null;
}

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
  labelFor,
  iconFor,
}: FilterRowProps<T>) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="me-1 text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
        {label}
      </span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const Icon = iconFor?.(option) ?? null;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={value === option}
              className={`filter-chip${value === option ? ' is-active' : ''}`}
              onClick={() => onChange(option)}
            >
              {Icon ? <Icon aria-hidden="true" className="h-3.5 w-3.5" /> : null}
              {labelFor(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
