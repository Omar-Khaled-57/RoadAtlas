import { BookOpen, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link } from 'react-router-dom';
import { MarkdownContent } from '../components/MarkdownContent';
import {
  useCreateNote,
  useDeleteNote,
  useOwnerNotes,
  usePublicNotes,
  useSession,
  useUpdateNote,
} from '../data/queries';
import { isHttpUrl, noteTargetHref } from '../lib/knowledge';
import { localize } from '../lib/localize';
import type { Note, NoteTarget } from '@shared/index';

type TargetFilter = NoteTarget | 'all';

const TARGET_FILTERS: TargetFilter[] = ['all', 'roadmap', 'step', 'tech', 'decision'];

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

interface NoteDraft {
  targetType: NoteTarget;
  targetId: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  tags: string;
  references: string;
  visibility: 'private' | 'public';
}

const EMPTY_DRAFT: NoteDraft = {
  targetType: 'roadmap',
  targetId: '',
  titleEn: '',
  titleAr: '',
  contentEn: '',
  contentAr: '',
  tags: '',
  references: '',
  visibility: 'private',
};

function parseList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function draftFromNote(note: Note): NoteDraft {
  return {
    targetType: note.targetType,
    targetId: note.targetId,
    titleEn: note.title.en,
    titleAr: note.title.ar ?? '',
    contentEn: note.content.en,
    contentAr: note.content.ar ?? '',
    tags: note.tags.join(', '),
    references: note.references.join(', '),
    visibility: note.visibility,
  };
}

export function KnowledgePage() {
  usePageMeta({ titleKey: 'seo.knowledge.title', descriptionKey: 'seo.knowledge.description' });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);

  const publicNotes = usePublicNotes();
  const ownerNotes = useOwnerNotes(authenticated);
  const create = useCreateNote();
  const update = useUpdateNote();
  const remove = useDeleteNote();

  const [target, setTarget] = useState<TargetFilter>('all');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDraft>(EMPTY_DRAFT);

  const notes = useMemo(() => {
    const items = [...(publicNotes.data ?? []), ...(ownerNotes.data ?? [])];
    const seen = new Set<string>();
    const unique: Note[] = [];
    for (const note of items) {
      if (seen.has(note.id)) continue;
      seen.add(note.id);
      unique.push(note);
    }
    return unique;
  }, [ownerNotes.data, publicNotes.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes.filter((note) => {
      if (target !== 'all' && note.targetType !== target) return false;
      if (!q) return true;
      const title = localize(note.title, lang).toLowerCase();
      const content = localize(note.content, lang).toLowerCase();
      const tags = note.tags.join(' ').toLowerCase();
      return title.includes(q) || content.includes(q) || tags.includes(q);
    });
  }, [lang, notes, query, target]);

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFormOpen(false);
  }

  function startEdit(note: Note) {
    setDraft(draftFromNote(note));
    setEditingId(note.id);
    setFormOpen(true);
    document.getElementById('note-form')?.scrollIntoView({ block: 'start' });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = {
      targetType: draft.targetType,
      targetId: draft.targetId.trim(),
      title: draft.titleAr ? { en: draft.titleEn, ar: draft.titleAr } : { en: draft.titleEn },
      content: draft.contentAr
        ? { en: draft.contentEn, ar: draft.contentAr }
        : { en: draft.contentEn },
      tags: parseList(draft.tags),
      references: parseList(draft.references),
      visibility: draft.visibility,
    };

    if (editingId) {
      update.mutate({ id: editingId, input }, { onSuccess: resetForm });
    } else {
      create.mutate(input, { onSuccess: resetForm });
    }
  }

  const busy = create.isPending || update.isPending;
  const formError = create.isError || update.isError;
  const ownNote = (note: Note) => Boolean(session?.user && note.ownerId === session.user.id);

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('knowledge.eyebrow')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('knowledge.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('knowledge.subtitle')}</p>
        </div>
        <p className="text-sm text-fg-muted">{t('knowledge.count', { value: filtered.length })}</p>
      </header>

      <section className="surface-card space-y-3 p-4 sm:p-5" aria-label={t('knowledge.filters')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
            {t('knowledge.filterTarget')}
          </span>
          <div
            role="group"
            aria-label={t('knowledge.filterTarget')}
            className="flex flex-wrap gap-2"
          >
            {TARGET_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={target === option}
                className={`filter-chip${target === option ? ' is-active' : ''}`}
                onClick={() => setTarget(option)}
              >
                {option === 'all' ? t('knowledge.all') : t(`knowledge.target.${option}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <label htmlFor="knowledge-search" className="text-sm font-semibold text-fg-secondary">
            {t('knowledge.searchLabel')}
          </label>
          <input
            id="knowledge-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={INPUT_CLASS}
            placeholder={t('knowledge.searchPlaceholder')}
          />
        </div>
      </section>

      {authenticated ? (
        <section className="surface-card space-y-4 p-5 sm:p-6" aria-labelledby="owner-notes-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="owner-notes-title" className="text-lg font-bold">
                {t('knowledge.owner.title')}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-fg-muted">
                {t('knowledge.owner.subtitle')}
              </p>
            </div>
            <button
              type="button"
              className="secondary-button"
              aria-expanded={formOpen}
              onClick={() => {
                if (formOpen) {
                  resetForm();
                } else {
                  setEditingId(null);
                  setDraft(EMPTY_DRAFT);
                  setFormOpen(true);
                }
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('knowledge.owner.new')}
            </button>
          </div>

          {formOpen ? (
            <form
              id="note-form"
              onSubmit={submit}
              className="grid scroll-mt-24 gap-4 rounded-2xl border border-border-subtle p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="note-target" className="text-sm font-semibold text-fg-secondary">
                    {t('knowledge.owner.form.targetType')}
                  </label>
                  <select
                    id="note-target"
                    value={draft.targetType}
                    onChange={(event) =>
                      setDraft({ ...draft, targetType: event.target.value as NoteTarget })
                    }
                    className={INPUT_CLASS}
                  >
                    {TARGET_FILTERS.filter((item) => item !== 'all').map((item) => (
                      <option key={item} value={item}>
                        {t(`knowledge.target.${item}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="note-target-id"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('knowledge.owner.form.targetId')}
                  </label>
                  <input
                    id="note-target-id"
                    required
                    value={draft.targetId}
                    onChange={(event) => setDraft({ ...draft, targetId: event.target.value })}
                    className={INPUT_CLASS}
                    placeholder={t('knowledge.owner.form.targetIdHint')}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label
                    htmlFor="note-title-en"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('knowledge.owner.form.titleEn')}
                  </label>
                  <input
                    id="note-title-en"
                    required
                    value={draft.titleEn}
                    onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="note-title-ar"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('knowledge.owner.form.titleAr')}
                  </label>
                  <input
                    id="note-title-ar"
                    dir="rtl"
                    value={draft.titleAr}
                    onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label
                    htmlFor="note-content-en"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('knowledge.owner.form.contentEn')}
                  </label>
                  <textarea
                    id="note-content-en"
                    required
                    rows={8}
                    value={draft.contentEn}
                    onChange={(event) => setDraft({ ...draft, contentEn: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="note-content-ar"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('knowledge.owner.form.contentAr')}
                  </label>
                  <textarea
                    id="note-content-ar"
                    dir="rtl"
                    rows={8}
                    value={draft.contentAr}
                    onChange={(event) => setDraft({ ...draft, contentAr: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2 sm:col-span-2">
                  <label htmlFor="note-tags" className="text-sm font-semibold text-fg-secondary">
                    {t('knowledge.owner.form.tags')}
                  </label>
                  <input
                    id="note-tags"
                    value={draft.tags}
                    onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="note-visibility"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('knowledge.owner.form.visibility')}
                  </label>
                  <select
                    id="note-visibility"
                    value={draft.visibility}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        visibility: event.target.value as 'private' | 'public',
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="private">{t('knowledge.owner.visibility.private')}</option>
                    <option value="public">{t('knowledge.owner.visibility.public')}</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="note-refs" className="text-sm font-semibold text-fg-secondary">
                  {t('knowledge.owner.form.references')}
                </label>
                <textarea
                  id="note-refs"
                  rows={3}
                  value={draft.references}
                  onChange={(event) => setDraft({ ...draft, references: event.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              {formError ? (
                <p role="alert" className="text-sm text-error">
                  {editingId ? t('knowledge.owner.updateError') : t('knowledge.owner.createError')}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !draft.titleEn.trim() ||
                    !draft.contentEn.trim() ||
                    !draft.targetId.trim()
                  }
                  className="primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {busy
                    ? t(`knowledge.owner.form.${editingId ? 'updating' : 'creating'}`)
                    : t(`knowledge.owner.form.${editingId ? 'update' : 'create'}`)}
                </button>
                <button type="button" className="secondary-button" onClick={resetForm}>
                  {t('knowledge.owner.form.cancel')}
                </button>
              </div>
            </form>
          ) : null}

          {!ownerNotes.isPending && !ownerNotes.isError && (ownerNotes.data ?? []).length === 0 ? (
            <p className="text-sm text-fg-muted">{t('knowledge.owner.empty')}</p>
          ) : null}
          {ownerNotes.isError ? (
            <p
              role="alert"
              className="rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error"
            >
              {t('knowledge.owner.error')}
            </p>
          ) : null}
        </section>
      ) : null}

      {filtered.length === 0 ? (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-primary-soft text-primary">
            <BookOpen aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">
            {query || target !== 'all'
              ? t('knowledge.emptyFiltered.title')
              : t('knowledge.empty.title')}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {query || target !== 'all'
              ? t('knowledge.emptyFiltered.body')
              : t('knowledge.empty.body')}
          </p>
          {query || target !== 'all' ? (
            <button
              type="button"
              className="secondary-button mt-5"
              onClick={() => {
                setQuery('');
                setTarget('all');
              }}
            >
              {t('knowledge.emptyFiltered.cta')}
            </button>
          ) : (
            <Link to="/roadmaps" className="primary-button mt-5">
              <BookOpen aria-hidden="true" className="h-4 w-4" />
              {t('knowledge.empty.cta')}
            </Link>
          )}
        </section>
      ) : (
        <div className="grid gap-4">
          {filtered.map((note) => (
            <article key={note.id} className="surface-card space-y-4 p-5 sm:p-6">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={noteTargetHref(note)} className="kind-badge kind-badge--hub">
                      <span className="kind-badge__dot" aria-hidden="true" />
                      {t(`knowledge.target.${note.targetType}`)}
                    </Link>
                    <span className="text-xs text-fg-muted">{note.targetId}</span>
                    {ownNote(note) ? (
                      <span className="tag-chip">{t('knowledge.yours')}</span>
                    ) : null}
                    {note.visibility === 'private' ? (
                      <span className="tag-chip">{t('knowledge.owner.visibility.private')}</span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {localize(note.title, lang)}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="tag-chip"
                        onClick={() => setQuery(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/knowledge/${note.id}`} className="secondary-button">
                    {t('knowledge.view')}
                  </Link>
                  {ownNote(note) ? (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startEdit(note)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t('common.edit')}
                    </button>
                  ) : null}
                </div>
              </header>

              <MarkdownContent content={localize(note.content, lang)} headingLevel={3} />

              {note.references.length > 0 ? (
                <footer className="space-y-2">
                  <p className="text-sm font-semibold text-fg-secondary">
                    {t('knowledge.references')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {note.references.map((ref) =>
                      isHttpUrl(ref) ? (
                        <a
                          key={ref}
                          href={ref}
                          target="_blank"
                          rel="noreferrer"
                          className="tag-chip"
                        >
                          {ref}
                        </a>
                      ) : (
                        <span key={ref} className="tag-chip">
                          {ref}
                        </span>
                      ),
                    )}
                  </div>
                </footer>
              ) : null}

              {ownNote(note) ? (
                <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-3">
                  {confirmingId === note.id ? (
                    <>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={remove.isPending}
                        onClick={() => {
                          remove.mutate(note.id);
                          setConfirmingId(null);
                        }}
                      >
                        {t('common.deleteConfirm')}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setConfirmingId(null)}
                      >
                        {t('common.deleteCancel')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setConfirmingId(note.id)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t('common.delete')}
                    </button>
                  )}
                  {remove.isError ? (
                    <p role="alert" className="text-sm text-error">
                      {t('knowledge.owner.deleteError')}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default KnowledgePage;
