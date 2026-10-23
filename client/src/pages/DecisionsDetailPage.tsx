import { ArrowDownLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useParams } from 'react-router-dom';
import { MarkdownContent } from '../components/MarkdownContent';
import { useDecision } from '../data/queries';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';

export default function DecisionsDetailPage() {
  usePageMeta({
    titleKey: 'seo.decisionsDetail.title',
    descriptionKey: 'seo.decisionsDetail.description',
  });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { id } = useParams();
  const { data: record, isPending } = useDecision(id);

  if (isPending) {
    return <div className="surface-card p-6 text-sm text-fg-muted">{t('common.loading')}</div>;
  }

  if (!record) {
    return (
      <div className="surface-card space-y-3 p-6">
        <p className="section-eyebrow">{t('decisions.eyebrow')}</p>
        <h1 className="text-2xl font-bold">{t('decisions.empty.title')}</h1>
        <Link to="/decisions" className="secondary-button">
          <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('decisions.detail.backToDecisions')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <Link
        to="/decisions"
        className="inline-flex min-h-6 items-center gap-2 text-sm text-fg-muted"
      >
        <ArrowDownLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        {t('decisions.detail.backToDecisions')}
      </Link>

      <article className="surface-card space-y-6 p-5 sm:p-8">
        <header className="space-y-3">
          <p className="section-eyebrow">{t('decisions.eyebrow')}</p>
          <h1 className="text-3xl font-bold tracking-tight">{localize(record.decision, lang)}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
            <span>{t('decisions.updated', { date: formatDate(record.updatedAt, lang) })}</span>
            {record.revisitAt ? (
              <span className="tag-chip">
                {t('decisions.revisit', { date: formatDate(record.revisitAt, lang) })}
              </span>
            ) : null}
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('decisions.context')}</h2>
          <MarkdownContent content={localize(record.context, lang)} headingLevel={3} />
        </section>

        {record.alternatives.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('decisions.alternatives')}</h2>
            <div className="grid gap-2">
              {record.alternatives.map((alt, index) => (
                <div key={index} className="rounded-2xl border border-border-subtle p-4">
                  {localize(alt, lang)}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">{t('decisions.consequences')}</h2>
          <MarkdownContent content={localize(record.consequences, lang)} headingLevel={3} />
        </section>

        {record.links.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">{t('decisions.links')}</h2>
            <div className="flex flex-wrap gap-2">
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
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}
