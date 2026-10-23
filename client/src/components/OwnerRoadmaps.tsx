import { useState } from 'react';
import { LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { KindBadge } from './RoadmapBadges';
import {
  toRoadmapInput,
  useCreateRoadmap,
  useDeleteRoadmap,
  useOwnerRoadmaps,
  useSession,
  type RoadmapDraft,
} from '../data/queries';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';

const EMPTY_DRAFT: RoadmapDraft = {
  title: '',
  titleAr: '',
  description: '',
  kind: 'tech',
  visibility: 'private',
};

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

/**
 * The owner's own roadmaps: the CRUD surface for the persisted data the API owns.
 * The catalogue above it stays the curated, public dataset.
 */
export function OwnerRoadmaps() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);

  const roadmaps = useOwnerRoadmaps(authenticated);
  const create = useCreateRoadmap();
  const remove = useDeleteRoadmap();

  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<RoadmapDraft>(EMPTY_DRAFT);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!authenticated) return null;

  const items = roadmaps.data ?? [];

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate(toRoadmapInput(draft), {
      onSuccess: () => {
        setDraft(EMPTY_DRAFT);
        setFormOpen(false);
      },
    });
  }

  return (
    <section className="surface-card space-y-4 p-5 sm:p-6" aria-labelledby="owner-roadmaps-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="owner-roadmaps-title" className="text-lg font-bold">
            {t('workspace.title')}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t('workspace.subtitle')}</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          aria-expanded={formOpen}
          onClick={() => setFormOpen((open) => !open)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('workspace.new')}
        </button>
      </div>

      {formOpen ? (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border-subtle p-4">
          <div className="grid gap-2">
            <label htmlFor="owner-title-en" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleEn')}
            </label>
            <input
              id="owner-title-en"
              name="title"
              required
              maxLength={300}
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="owner-title-ar" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.titleAr')}
            </label>
            <input
              id="owner-title-ar"
              name="titleAr"
              dir="rtl"
              maxLength={300}
              value={draft.titleAr}
              onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="owner-description" className="text-sm font-semibold text-fg-secondary">
              {t('workspace.form.description')}
            </label>
            <textarea
              id="owner-description"
              name="description"
              rows={3}
              maxLength={300}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="owner-kind" className="text-sm font-semibold text-fg-secondary">
                {t('workspace.form.kind')}
              </label>
              <select
                id="owner-kind"
                name="kind"
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as RoadmapDraft['kind'] })
                }
                className={INPUT_CLASS}
              >
                <option value="hub">{t('workspace.kind.hub')}</option>
                <option value="tech">{t('workspace.kind.tech')}</option>
                <option value="pipeline">{t('workspace.kind.pipeline')}</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="owner-visibility" className="text-sm font-semibold text-fg-secondary">
                {t('workspace.form.visibility')}
              </label>
              <select
                id="owner-visibility"
                name="visibility"
                value={draft.visibility}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    visibility: event.target.value as RoadmapDraft['visibility'],
                  })
                }
                className={INPUT_CLASS}
              >
                <option value="private">{t('workspace.visibility.private')}</option>
                <option value="public">{t('workspace.visibility.public')}</option>
              </select>
            </div>
          </div>

          {create.isError ? (
            <p role="alert" className="text-sm text-error">
              {t('workspace.createError')}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={create.isPending || !draft.title.trim()}
              className="primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {create.isPending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {create.isPending ? t('workspace.form.creating') : t('workspace.form.create')}
            </button>
            <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>
              {t('workspace.form.cancel')}
            </button>
          </div>
        </form>
      ) : null}

      {roadmaps.isError ? (
        <p
          role="alert"
          className="rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error"
        >
          {t('workspace.error')}
        </p>
      ) : null}

      {roadmaps.isPending ? (
        <p className="text-sm text-fg-muted">{t('workspace.loading')}</p>
      ) : null}

      {!roadmaps.isPending && !roadmaps.isError && items.length === 0 ? (
        <p className="text-sm text-fg-muted">{t('workspace.empty')}</p>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
          {items.map((roadmap) => (
            <li key={roadmap.id} className="rounded-2xl border border-border-subtle p-4">
              <div className="flex flex-wrap items-center gap-2">
                <KindBadge kind={roadmap.kind} />
                <span className="kind-badge kind-badge--hub">
                  <span className="kind-badge__dot" aria-hidden="true" />
                  {t(`workspace.visibility.${roadmap.visibility}`)}
                </span>
              </div>
              <h3 className="mt-2 font-semibold">
                <Link to={`/roadmaps/${roadmap.id}`} className="text-fg-primary hover:text-primary">
                  {localize(roadmap.title, lang)}
                </Link>
              </h3>
              <p className="mt-1 text-xs text-fg-muted">
                {t('workspace.updated', { date: formatDate(roadmap.updatedAt, lang) })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/roadmaps/${roadmap.id}`} className="secondary-button">
                  {t('workspace.open')}
                </Link>
                {confirmingId === roadmap.id ? (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        remove.mutate(roadmap.id);
                        setConfirmingId(null);
                      }}
                    >
                      {t('workspace.deleteConfirm')}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmingId(null)}
                    >
                      {t('workspace.deleteCancel')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setConfirmingId(roadmap.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t('workspace.delete')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
