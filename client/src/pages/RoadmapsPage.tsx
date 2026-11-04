import { Map as MapIcon, Plus, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useNavigate } from 'react-router-dom';
import { OwnerRoadmaps } from '../components/OwnerRoadmaps';
import { RoadmapCard } from '../components/RoadmapCard';
import { Dialog } from '../components/Dialog';
import { useRoadmapGraph } from '../data/roadmapGraph';
import { roadmapStatus, type RoadmapDisplayStatus } from '../data/roadmaps';
import { useCreateRoadmap, useSession } from '../data/queries';
import { KIND_ICON } from '../lib/roadmapMeta';
import { localize } from '../lib/localize';
import { techProfiles } from '../data/techCatalogue';
import type { RoadmapKind } from '@shared/index';

type KindFilter = RoadmapKind | 'all';
type StatusFilter = RoadmapDisplayStatus | 'all';

const KIND_FILTERS: KindFilter[] = ['all', 'hub', 'tech', 'pipeline'];
const STATUS_FILTERS: StatusFilter[] = ['all', 'planned', 'in-progress', 'completed', 'paused'];

export function RoadmapsPage() {
  usePageMeta({ titleKey: 'seo.roadmaps.title', descriptionKey: 'seo.roadmaps.description' });
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const { roadmaps: items, isLoading } = useRoadmapGraph();
  const [kind, setKind] = useState<KindFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    titleAr: '',
    kind: 'tech' as RoadmapKind,
    techId: '',
    visibility: 'private' as 'public' | 'private',
  });
  const createRoadmap = useCreateRoadmap();
  const navigate = useNavigate();

  const roadmaps = useMemo(
    () =>
      items.filter(
        (roadmap) =>
          (kind === 'all' || roadmap.kind === kind) &&
          (status === 'all' || roadmapStatus(roadmap) === status),
      ),
    [items, kind, status],
  );

  const isFiltered = kind !== 'all' || status !== 'all';

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    createRoadmap.mutate(
      {
        title: draft.titleAr.trim()
          ? { en: draft.title.trim(), ar: draft.titleAr.trim() }
          : { en: draft.title.trim() },
        kind: draft.kind,
        visibility: draft.visibility,
        ...(draft.kind === 'tech' && draft.techId ? { techId: draft.techId } : {}),
        order: roadmaps.length,
        topics: [],
        steps: [],
      },
      {
        onSuccess: (roadmap) => {
          setDialogOpen(false);
          setDraft({ title: '', titleAr: '', kind: 'tech', techId: '', visibility: 'private' });
          navigate(`/roadmaps/${roadmap.id}`);
        },
      },
    );
  }

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('roadmaps.eyebrow')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('roadmaps.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('roadmaps.subtitle')}</p>
        </div>
        <div className="flex items-end gap-2">
          {authenticated ? (
            <button
              type="button"
              className="primary-button"
              disabled={createRoadmap.isPending}
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('workspace.new')}
            </button>
          ) : null}
          <p className="text-sm text-fg-muted">{t('roadmaps.count', { value: roadmaps.length })}</p>
        </div>
      </header>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDraft({ title: '', titleAr: '', kind: 'tech', techId: '', visibility: 'private' });
        }}
        titleKey="workspace.new"
      >
        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <label htmlFor="roadmap-title-en" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleEn')}
            </label>
            <input
              id="roadmap-title-en"
              name="title"
              required
              maxLength={300}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className="w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="roadmap-title-ar" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleAr')}
            </label>
            <input
              id="roadmap-title-ar"
              name="titleAr"
              dir="rtl"
              maxLength={300}
              value={draft.titleAr}
              onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
              className="w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="roadmap-kind" className="text-sm font-semibold text-fg-secondary">
                {t('workspace.form.kind')}
              </label>
              <select
                id="roadmap-kind"
                name="kind"
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as RoadmapKind })
                }
                className="w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              >
                <option value="hub">{t('workspace.kind.hub')}</option>
                <option value="tech">{t('workspace.kind.tech')}</option>
                <option value="pipeline">{t('workspace.kind.pipeline')}</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="roadmap-visibility"
                className="text-sm font-semibold text-fg-secondary"
              >
                {t('workspace.form.visibility')}
              </label>
              <select
                id="roadmap-visibility"
                name="visibility"
                value={draft.visibility}
                onChange={(event) =>
                  setDraft({ ...draft, visibility: event.target.value as 'public' | 'private' })
                }
                className="w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              >
                <option value="private">{t('workspace.visibility.private')}</option>
                <option value="public">{t('workspace.visibility.public')}</option>
              </select>
            </div>
          </div>
          {draft.kind === 'tech' ? (
            <div className="grid gap-2">
              <label htmlFor="roadmap-tech" className="text-sm font-semibold text-fg-secondary">
                {t('workspace.form.tech')}
              </label>
              <select
                id="roadmap-tech"
                name="techId"
                value={draft.techId}
                onChange={(event) => setDraft({ ...draft, techId: event.target.value })}
                className="w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft"
              >
                <option value="">{t('workspace.form.techNone')}</option>
                {techProfiles.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {localize(tech.name, i18n.language)}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
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
                <span className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {createRoadmap.isPending ? t('workspace.form.creating') : t('workspace.form.create')}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setDialogOpen(false);
                setDraft({
                  title: '',
                  titleAr: '',
                  kind: 'tech',
                  techId: '',
                  visibility: 'private',
                });
              }}
            >
              {t('workspace.form.cancel')}
            </button>
          </div>
        </form>
      </Dialog>

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

      <h2 className="sr-only">{t('roadmaps.catalog')}</h2>

      {isLoading ? (
        <p role="status" className="text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      ) : roadmaps.length > 0 ? (
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

      <OwnerRoadmaps />
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
