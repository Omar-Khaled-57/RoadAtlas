import { ArrowUpRight, EllipsisVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { roadmapProgress, roadmapStatus, type RoadmapStep } from '../data/roadmaps';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import { KIND_ICON, KIND_TONE } from '../lib/roadmapMeta';
import type { LocalizedString, Roadmap } from '@shared/index';
import { KindBadge, StatusBadge } from './RoadmapBadges';
import { RoadmapTrail } from './RoadmapTrail';
import { Dialog } from './Dialog';
import { useSession, useDeleteRoadmap, useUpdateRoadmap } from '../data/queries';

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

/**
 * Server records omit nested steps while demo seeds always include them, so the
 * card accepts either shape and degrades to "0 steps" when none are present.
 */
export type RoadmapCardModel = Omit<Roadmap, 'prerequisites' | 'topics' | 'paused'> & {
  steps?: RoadmapStep[];
  prerequisites?: Array<string | LocalizedString>;
  topics?: Array<string | LocalizedString>;
  paused?: boolean;
};

export function RoadmapCard({ roadmap }: { roadmap: RoadmapCardModel }) {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const lang = i18n.language;
  const steps = roadmap.steps ?? [];
  const progress = roadmapProgress(roadmap);
  const tone = KIND_TONE[roadmap.kind];
  const Icon = KIND_ICON[roadmap.kind];
  const title = localize(roadmap.title, lang);
  const authenticated = Boolean(session?.authenticated);
  const isOwner = authenticated && Boolean(session?.user?.id === roadmap.ownerId);

  const updateRoadmap = useUpdateRoadmap();
  const removeRoadmap = useDeleteRoadmap();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({
    title: roadmap.title.en,
    titleAr: roadmap.title.ar ?? '',
    visibility: roadmap.visibility,
  });

  function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateRoadmap.mutate(
      {
        id: roadmap.id,
        input: {
          title: editDraft.titleAr.trim()
            ? { en: editDraft.title.trim(), ar: editDraft.titleAr.trim() }
            : { en: editDraft.title.trim() },
          visibility: editDraft.visibility,
        },
      },
      {
        onSuccess: () => {
          setEditOpen(false);
        },
      },
    );
  }

  function confirmDelete() {
    removeRoadmap.mutate(roadmap.id);
    setDeleteOpen(false);
  }

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
        {isOwner ? (
          <button
            type="button"
            aria-label={`${t('common.actions')} ${title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-fg-muted transition hover:bg-surface-hover hover:text-fg-primary"
            onClick={(event) => {
              event.stopPropagation();
              setEditDraft({
                title: roadmap.title.en,
                titleAr: roadmap.title.ar ?? '',
                visibility: roadmap.visibility,
              });
              setEditOpen(true);
            }}
          >
            <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <h3 className="mt-5 font-bold">{title}</h3>
      <p className="mt-1 line-clamp-2 min-h-8 text-xs text-fg-muted">
        {localize(roadmap.description, lang)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <KindBadge kind={roadmap.kind} />
        <span className="text-xs text-fg-muted">
          {t('roadmaps.steps', { value: steps.length })}
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
          {t('roadmaps.route')}
        </span>
        <strong className="text-xs">{progress}%</strong>
      </div>
      <RoadmapTrail total={steps.length} progress={progress} tone={tone} />
      <p className="mt-2 text-xs text-fg-muted">
        {t('roadmaps.updated', { date: formatDate(roadmap.updatedAt, lang) })}
      </p>
      <Link
        to={`/roadmaps/${roadmap.id}`}
        className="stretched-link"
        aria-label={`${t('roadmaps.open')} ${title}`}
      />

      {isOwner ? (
        <>
          <Dialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            titleKey="workspace.editRoadmap"
          >
            <form onSubmit={submitEdit} className="grid gap-4" noValidate>
              <div className="grid gap-2">
                <label htmlFor="card-title-en" className="text-sm font-semibold text-fg-secondary">
                  {t('workspace.form.titleEn')}
                </label>
                <input
                  id="card-title-en"
                  name="title"
                  required
                  maxLength={300}
                  value={editDraft.title}
                  onChange={(event) => setEditDraft({ ...editDraft, title: event.target.value })}
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="card-title-ar" className="text-sm font-semibold text-fg-secondary">
                  {t('workspace.form.titleAr')}
                </label>
                <input
                  id="card-title-ar"
                  name="titleAr"
                  dir="rtl"
                  maxLength={300}
                  value={editDraft.titleAr}
                  onChange={(event) => setEditDraft({ ...editDraft, titleAr: event.target.value })}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="card-visibility"
                  className="text-sm font-semibold text-fg-secondary"
                >
                  {t('workspace.form.visibility')}
                </label>
                <select
                  id="card-visibility"
                  name="visibility"
                  value={editDraft.visibility}
                  onChange={(event) =>
                    setEditDraft({
                      ...editDraft,
                      visibility: event.target.value as 'public' | 'private',
                    })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="private">{t('workspace.visibility.private')}</option>
                  <option value="public">{t('workspace.visibility.public')}</option>
                </select>
              </div>
              {updateRoadmap.isError ? (
                <p role="alert" className="text-sm text-error">
                  {t('workspace.updateError')}
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateRoadmap.isPending || !editDraft.title.trim()}
                  className="primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateRoadmap.isPending ? (
                    <span className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditOpen(false)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </Dialog>

          <Dialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            titleKey="workspace.delete"
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              className="grid gap-4"
              noValidate
            >
              <p className="text-sm text-fg-secondary">
                {t('workspace.deleteConfirmBody', { title })}
              </p>
              {removeRoadmap.isError ? (
                <p role="alert" className="text-sm text-error">
                  {t('workspace.deleteError') || t('workspace.updateError')}
                </p>
              ) : null}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDeleteOpen(false)}
                >
                  {t('workspace.deleteCancel')}
                </button>
                <button
                  type="submit"
                  disabled={removeRoadmap.isPending}
                  className="primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60 text-error"
                >
                  {removeRoadmap.isPending ? (
                    <span className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {t('workspace.deleteConfirm')}
                </button>
              </div>
            </form>
          </Dialog>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="absolute end-2 bottom-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error/30 bg-error-soft text-error transition hover:bg-error hover:text-white"
            aria-label={t('workspace.delete')}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      ) : null}
    </article>
  );
}
