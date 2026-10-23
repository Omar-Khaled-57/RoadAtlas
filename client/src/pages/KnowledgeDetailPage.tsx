import { ArrowDownLeft, Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useParams } from 'react-router-dom';
import { MarkdownContent } from '../components/MarkdownContent';
import { useNote } from '../data/queries';
import { isHttpUrl, noteTargetHref } from '../lib/knowledge';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';

export default function KnowledgeDetailPage() {
  usePageMeta({
    titleKey: 'seo.knowledgeDetail.title',
    descriptionKey: 'seo.knowledgeDetail.description',
  });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { id } = useParams();
  const { data: note, isPending } = useNote(id);

  if (isPending) {
    return <div className="surface-card p-6 text-sm text-fg-muted">{t('common.loading')}</div>;
  }

  if (!note) {
    return (
      <div className="surface-card space-y-3 p-6">
        <p className="section-eyebrow">{t('knowledge.eyebrow')}</p>
        <h1 className="text-2xl font-bold">{t('knowledge.empty.title')}</h1>
        <Link to="/knowledge" className="secondary-button">
          <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('knowledge.detail.backToKnowledge')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/knowledge"
          className="inline-flex min-h-6 items-center gap-2 text-sm text-fg-muted"
        >
          <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('knowledge.detail.backToKnowledge')}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={noteTargetHref(note)} className="kind-badge kind-badge--hub">
            <span className="kind-badge__dot" aria-hidden="true" />
            {t(`knowledge.target.${note.targetType}`)}
          </Link>
          <span className="text-xs text-fg-muted">{note.targetId}</span>
        </div>
      </div>

      <article className="surface-card space-y-6 p-5 sm:p-8">
        <header className="space-y-3">
          <p className="section-eyebrow">{t('knowledge.eyebrow')}</p>
          <h1 className="text-3xl font-bold tracking-tight">{localize(note.title, lang)}</h1>
          <p className="text-sm text-fg-muted">
            {t('knowledge.updated', { date: formatDate(note.updatedAt, lang) })}
          </p>
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <MarkdownContent content={localize(note.content, lang)} headingLevel={2} />

        {note.references.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('knowledge.references')}</h2>
            <div className="grid gap-2">
              {note.references.map((ref) =>
                isHttpUrl(ref) ? (
                  <a
                    key={ref}
                    href={ref}
                    target="_blank"
                    rel="noreferrer"
                    className="surface-card flex items-center gap-3 p-4 text-sm text-fg-primary hover:bg-surface-hover"
                  >
                    <Link2 className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                    <span className="truncate">{ref}</span>
                  </a>
                ) : (
                  <span key={ref} className="surface-card flex items-center gap-3 p-4 text-sm">
                    <Link2 className="h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                    <span className="truncate">{ref}</span>
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
