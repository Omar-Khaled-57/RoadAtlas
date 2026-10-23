import { FileText, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link } from 'react-router-dom';
import { MarkdownContent } from '../components/MarkdownContent';
import {
  useCreateDecision,
  useDeleteDecision,
  useOwnerDecisions,
  usePublicDecisions,
  useSession,
  useUpdateDecision,
} from '../data/queries';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import type { DecisionRecord } from '@shared/index';

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

interface DecisionDraft {
  contextEn: string;
  contextAr: string;
  alternativesEn: string;
  alternativesAr: string;
  decisionEn: string;
  decisionAr: string;
  consequencesEn: string;
  consequencesAr: string;
  revisitAt: string;
  links: string;
  visibility: 'private' | 'public';
}

const EMPTY_DRAFT: DecisionDraft = {
  contextEn: '',
  contextAr: '',
  alternativesEn: '',
  alternativesAr: '',
  decisionEn: '',
  decisionAr: '',
  consequencesEn: '',
  consequencesAr: '',
  revisitAt: '',
  links: '',
  visibility: 'private',
};

function parseLines(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLinks(value: string): Array<{ label: string; url: string }> {
  return parseLines(value).map((line) => {
    const [label, url] = line.split('|').map((part) => part.trim());
    return { label: label || url || line, url: url || line };
  });
}

function draftFromDecision(record: DecisionRecord): DecisionDraft {
  return {
    contextEn: record.context.en,
    contextAr: record.context.ar ?? '',
    alternativesEn: record.alternatives.map((item) => item.en).join('\n'),
    alternativesAr: record.alternatives.map((item) => item.ar ?? '').join('\n'),
    decisionEn: record.decision.en,
    decisionAr: record.decision.ar ?? '',
    consequencesEn: record.consequences.en,
    consequencesAr: record.consequences.ar ?? '',
    revisitAt: record.revisitAt ? record.revisitAt.slice(0, 10) : '',
    links: record.links.map((link) => `${link.label}|${link.url}`).join('\n'),
    visibility: record.visibility,
  };
}

export function DecisionsPage() {
  usePageMeta({ titleKey: 'seo.decisions.title', descriptionKey: 'seo.decisions.description' });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);

  const publicDecisions = usePublicDecisions();
  const ownerDecisions = useOwnerDecisions(authenticated);
  const create = useCreateDecision();
  const update = useUpdateDecision();
  const remove = useDeleteDecision();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DecisionDraft>(EMPTY_DRAFT);

  const records = useMemo(() => {
    const items = [...(publicDecisions.data ?? []), ...(ownerDecisions.data ?? [])];
    const seen = new Set<string>();
    const unique: DecisionRecord[] = [];
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      unique.push(item);
    }
    return unique;
  }, [ownerDecisions.data, publicDecisions.data]);

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFormOpen(false);
  }

  function startEdit(record: DecisionRecord) {
    setDraft(draftFromDecision(record));
    setEditingId(record.id);
    setFormOpen(true);
    document.getElementById('decision-form')?.scrollIntoView({ block: 'start' });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const alternativesEn = parseLines(draft.alternativesEn);
    const alternativesAr = parseLines(draft.alternativesAr);
    const alternatives = alternativesEn.map((en, index) => ({
      en,
      ar: alternativesAr[index] || en,
    }));
    const input = {
      context: draft.contextAr
        ? { en: draft.contextEn, ar: draft.contextAr }
        : { en: draft.contextEn },
      alternatives,
      decision: draft.decisionAr
        ? { en: draft.decisionEn, ar: draft.decisionAr }
        : { en: draft.decisionEn },
      consequences: draft.consequencesAr
        ? { en: draft.consequencesEn, ar: draft.consequencesAr }
        : { en: draft.consequencesEn },
      revisitAt: draft.revisitAt
        ? new Date(`${draft.revisitAt}T00:00:00.000Z`).toISOString()
        : undefined,
      links: parseLinks(draft.links),
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
  const ownRecord = (record: DecisionRecord) =>
    Boolean(session?.user && record.ownerId === session.user.id);

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('decisions.eyebrow')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('decisions.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('decisions.subtitle')}</p>
        </div>
        <p className="text-sm text-fg-muted">{t('decisions.count', { value: records.length })}</p>
      </header>

      {authenticated ? (
        <section
          className="surface-card space-y-4 p-5 sm:p-6"
          aria-labelledby="owner-decisions-title"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="owner-decisions-title" className="text-lg font-bold">
                {t('decisions.owner.title')}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-fg-muted">
                {t('decisions.owner.subtitle')}
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
              {t('decisions.owner.new')}
            </button>
          </div>

          {formOpen ? (
            <form
              id="decision-form"
              onSubmit={submit}
              className="grid scroll-mt-24 gap-4 rounded-2xl border border-border-subtle p-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label
                    htmlFor="dec-context-en"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.contextEn')}
                  </label>
                  <textarea
                    id="dec-context-en"
                    required
                    rows={4}
                    value={draft.contextEn}
                    onChange={(event) => setDraft({ ...draft, contextEn: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="dec-context-ar"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.contextAr')}
                  </label>
                  <textarea
                    id="dec-context-ar"
                    dir="rtl"
                    rows={4}
                    value={draft.contextAr}
                    onChange={(event) => setDraft({ ...draft, contextAr: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="dec-alt-en" className="text-sm font-semibold text-fg-secondary">
                    {t('decisions.owner.form.alternativesEn')}
                  </label>
                  <textarea
                    id="dec-alt-en"
                    rows={5}
                    value={draft.alternativesEn}
                    onChange={(event) => setDraft({ ...draft, alternativesEn: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="dec-alt-ar" className="text-sm font-semibold text-fg-secondary">
                    {t('decisions.owner.form.alternativesAr')}
                  </label>
                  <textarea
                    id="dec-alt-ar"
                    dir="rtl"
                    rows={5}
                    value={draft.alternativesAr}
                    onChange={(event) => setDraft({ ...draft, alternativesAr: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label
                    htmlFor="dec-decision-en"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.decisionEn')}
                  </label>
                  <textarea
                    id="dec-decision-en"
                    required
                    rows={4}
                    value={draft.decisionEn}
                    onChange={(event) => setDraft({ ...draft, decisionEn: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="dec-decision-ar"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.decisionAr')}
                  </label>
                  <textarea
                    id="dec-decision-ar"
                    dir="rtl"
                    rows={4}
                    value={draft.decisionAr}
                    onChange={(event) => setDraft({ ...draft, decisionAr: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label
                    htmlFor="dec-consequences-en"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.consequencesEn')}
                  </label>
                  <textarea
                    id="dec-consequences-en"
                    required
                    rows={4}
                    value={draft.consequencesEn}
                    onChange={(event) => setDraft({ ...draft, consequencesEn: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="dec-consequences-ar"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.consequencesAr')}
                  </label>
                  <textarea
                    id="dec-consequences-ar"
                    dir="rtl"
                    rows={4}
                    value={draft.consequencesAr}
                    onChange={(event) => setDraft({ ...draft, consequencesAr: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <label htmlFor="dec-revisit" className="text-sm font-semibold text-fg-secondary">
                    {t('decisions.owner.form.revisitAt')}
                  </label>
                  <input
                    id="dec-revisit"
                    type="date"
                    value={draft.revisitAt}
                    onChange={(event) => setDraft({ ...draft, revisitAt: event.target.value })}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <label
                    htmlFor="dec-visibility"
                    className="text-sm font-semibold text-fg-secondary"
                  >
                    {t('decisions.owner.form.visibility')}
                  </label>
                  <select
                    id="dec-visibility"
                    value={draft.visibility}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        visibility: event.target.value as 'private' | 'public',
                      })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="private">{t('decisions.owner.visibility.private')}</option>
                    <option value="public">{t('decisions.owner.visibility.public')}</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="dec-links" className="text-sm font-semibold text-fg-secondary">
                  {t('decisions.owner.form.links')}
                </label>
                <textarea
                  id="dec-links"
                  rows={3}
                  value={draft.links}
                  onChange={(event) => setDraft({ ...draft, links: event.target.value })}
                  className={INPUT_CLASS}
                />
              </div>

              {formError ? (
                <p role="alert" className="text-sm text-error">
                  {editingId ? t('decisions.owner.updateError') : t('decisions.owner.createError')}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    busy ||
                    !draft.contextEn.trim() ||
                    !draft.decisionEn.trim() ||
                    !draft.consequencesEn.trim()
                  }
                  className="primary-button min-h-11 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {busy
                    ? t(`decisions.owner.form.${editingId ? 'updating' : 'creating'}`)
                    : t(`decisions.owner.form.${editingId ? 'update' : 'create'}`)}
                </button>
                <button type="button" className="secondary-button" onClick={resetForm}>
                  {t('decisions.owner.form.cancel')}
                </button>
              </div>
            </form>
          ) : null}

          {!ownerDecisions.isPending &&
          !ownerDecisions.isError &&
          (ownerDecisions.data ?? []).length === 0 ? (
            <p className="text-sm text-fg-muted">{t('decisions.owner.empty')}</p>
          ) : null}
          {ownerDecisions.isError ? (
            <p
              role="alert"
              className="rounded-xl border border-error/30 bg-error-soft px-4 py-3 text-sm text-error"
            >
              {t('decisions.owner.error')}
            </p>
          ) : null}
        </section>
      ) : null}

      {records.length === 0 ? (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-primary-soft text-primary">
            <FileText aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">{t('decisions.empty.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">{t('decisions.empty.body')}</p>
          <Link to="/knowledge" className="primary-button mt-5">
            <FileText aria-hidden="true" className="h-4 w-4" />
            {t('decisions.empty.cta')}
          </Link>
        </section>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => {
            const context = localize(record.context, lang);
            const decision = localize(record.decision, lang);
            const consequences = localize(record.consequences, lang);
            return (
              <article key={record.id} className="surface-card space-y-4 p-5 sm:p-6">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {ownRecord(record) ? (
                        <span className="tag-chip">{t('knowledge.yours')}</span>
                      ) : null}
                      {record.visibility === 'private' ? (
                        <span className="tag-chip">{t('decisions.owner.visibility.private')}</span>
                      ) : null}
                      {record.revisitAt ? (
                        <span className="tag-chip">
                          {t('decisions.revisit', {
                            date: formatDate(record.revisitAt, lang),
                          })}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">{decision}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/decisions/${record.id}`} className="secondary-button">
                      {t('decisions.view')}
                    </Link>
                    {ownRecord(record) ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => startEdit(record)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        {t('common.edit')}
                      </button>
                    ) : null}
                  </div>
                </header>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-fg-secondary">
                    {t('decisions.context')}
                  </h3>
                  <MarkdownContent content={context} headingLevel={4} />
                </section>

                <section className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border-subtle p-4">
                    <h3 className="text-sm font-semibold text-fg-secondary">
                      {t('decisions.consequences')}
                    </h3>
                    <div className="mt-2">
                      <MarkdownContent content={consequences} headingLevel={4} />
                    </div>
                  </div>
                  {record.alternatives.length > 0 ? (
                    <div className="rounded-2xl border border-border-subtle p-4">
                      <h3 className="text-sm font-semibold text-fg-secondary">
                        {t('decisions.alternatives')}
                      </h3>
                      <ul className="mt-2 grid list-disc gap-2 ps-5">
                        {record.alternatives.map((alt, index) => (
                          <li key={index}>{localize(alt, lang)}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>

                {record.links.length > 0 ? (
                  <footer className="flex flex-wrap gap-2">
                    {record.links.map((link) => (
                      <a
                        key={`${link.url}-${link.label}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="tag-chip"
                      >
                        {link.label}
                      </a>
                    ))}
                  </footer>
                ) : null}

                {ownRecord(record) ? (
                  <div className="flex flex-wrap gap-2 border-t border-border-subtle pt-3">
                    {confirmingId === record.id ? (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={remove.isPending}
                          onClick={() => {
                            remove.mutate(record.id);
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
                        onClick={() => setConfirmingId(record.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {t('common.delete')}
                      </button>
                    )}
                    {remove.isError ? (
                      <p role="alert" className="text-sm text-error">
                        {t('decisions.owner.deleteError')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DecisionsPage;
