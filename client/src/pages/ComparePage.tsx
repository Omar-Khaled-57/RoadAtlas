import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  ExternalLink,
  Minus,
  Plus,
  Scale,
  Settings,
  TriangleAlert,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link, useParams } from 'react-router-dom';
import type { Comparison } from '@shared/index';
import { techProfiles, type TechProfile } from '../data/techCatalogue';
import { weightedScore } from '../data/comparisons';
import { formatDate } from '../lib/format';
import { localize } from '../lib/localize';
import { useComparison, useComparisons, useSession } from '../data/queries';

const TH = 'border-b border-border-subtle px-4 py-3 text-start align-top';
const TD = 'border-b border-border-subtle px-4 py-3 text-start align-top';

export function ComparePage() {
  usePageMeta({ titleKey: 'seo.compare.title', descriptionKey: 'seo.compare.description' });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { id } = useParams();
  const { data: comparisons = [] } = useComparisons('public');
  const { data: comparisonData, isLoading: comparisonLoading } = useComparison(id);
  const comparison = id ? comparisonData : comparisons[0];
  const { data: session } = useSession();
  const ownerId = comparison?.ownerId;
  const isOwner = Boolean(session?.authenticated && ownerId && session.user?.id === ownerId);

  if (!id) {
    return (
      <div className="page-enter space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow">{t('compare.eyebrow')}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('compare.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('compare.subtitle')}</p>
          </div>
        </header>
        {comparisons.length > 0 ? (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {comparisons.map((item) => (
              <li key={item.id}>
                <article className="roadmap-card">
                  <div className="flex items-start justify-between gap-3">
                    <span className="roadmap-icon tone-accent">
                      <Scale aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 text-fg-muted rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="mt-5 font-bold">{localize(item.title, lang)}</h2>
                  <p className="mt-1 line-clamp-2 min-h-8 text-xs text-fg-muted">
                    {t('compare.candidates', { value: item.candidateTechIds?.length || 0 })}
                  </p>
                  <Link
                    to={`/compare/${item.id}`}
                    className="stretched-link"
                    aria-label={localize(item.title, lang)}
                  />
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <section className="surface-card p-10 text-center">
            <h1 className="text-2xl font-bold">{t('compare.notFound.title')}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
              {t('compare.notFound.body')}
            </p>
            <Link to="/about" className="primary-button mt-5">
              {t('compare.notFound.cta')}
            </Link>
          </section>
        )}
      </div>
    );
  }

  if (id && comparisonLoading) {
    return (
      <div className="page-enter space-y-6">
        <p role="status" className="text-sm text-fg-muted">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="page-enter space-y-6">
        <section className="surface-card p-10 text-center">
          <h1 className="text-2xl font-bold">{t('compare.notFound.title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {t('compare.notFound.body')}
          </p>
          <Link to="/compare" className="primary-button mt-5">
            {t('compare.back')}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6">
      <Link
        to="/compare"
        className="inline-flex min-h-6 items-center gap-2 text-sm text-fg-muted hover:text-fg-primary"
      >
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
        {t('compare.back')}
      </Link>
      {isOwner ? (
        <div className="flex justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-border-default px-3 py-1 text-xs font-semibold text-fg-muted">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            {t('workspace.ownerControls')}
          </span>
        </div>
      ) : null}
      <ComparisonView comparison={comparison} lang={lang} />
    </div>
  );
}

function ComparisonView({ comparison, lang }: { comparison: Comparison; lang: string }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string[]>(comparison.candidateTechIds || []);

  const pool = techProfiles;
  const techs = pool.filter((tech) => selected.includes(tech.id));
  const enough = techs.length >= 2;

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const addNext = () => {
    const next = pool.find((tech) => !selected.includes(tech.id));
    if (next) setSelected((current) => [...current, next.id]);
  };

  return (
    <div className="page-enter space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-eyebrow">{t('compare.eyebrow')}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {localize(comparison.title, lang)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('compare.subtitle')}</p>
        </div>
        <p className="text-sm text-fg-muted">
          {t('compare.count', { value: comparison.criteria.length })}
        </p>
      </header>

      <section className="surface-card space-y-3 p-4 sm:p-5" aria-label={t('compare.pick')}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
            {t('compare.pick')}
          </span>
          <div role="group" aria-label={t('compare.pick')} className="flex flex-wrap gap-2">
            {pool.map((tech) => {
              const active = selected.includes(tech.id);
              return (
                <button
                  key={tech.id}
                  type="button"
                  aria-pressed={active}
                  className={`filter-chip${active ? ' is-active' : ''}`}
                  onClick={() => toggle(tech.id)}
                >
                  {active ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  {localize(tech.name, lang)}
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-fg-muted">{t('compare.pickHint')}</p>
      </section>

      {enough ? (
        <>
          <CriteriaTable comparison={comparison} techs={techs} lang={lang} />
          <TechQualities techs={techs} lang={lang} />
          <FrictionSection techs={techs} lang={lang} />
          <ConclusionSection comparison={comparison} techs={techs} lang={lang} />
          <EvidenceSection comparison={comparison} />
        </>
      ) : (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-primary-soft text-primary">
            <Scale aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">{t('compare.empty.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">{t('compare.empty.body')}</p>
          <button type="button" className="primary-button mt-5" onClick={addNext}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('compare.empty.cta')}
          </button>
        </section>
      )}
    </div>
  );
}

function CriteriaTable({
  comparison,
  techs,
  lang,
}: {
  comparison: Comparison;
  techs: TechProfile[];
  lang: string;
}) {
  const { t } = useTranslation();
  return (
    <section className="surface-card overflow-hidden" aria-labelledby="compare-criteria">
      <h2 id="compare-criteria" className="sr-only">
        {t('compare.criteria')}
      </h2>
      <div
        role="region"
        aria-label={t('compare.tableRegion')}
        tabIndex={0}
        className="overflow-x-auto"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">{localize(comparison.title, lang)}</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                <span className="text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
                  {t('compare.criteria')}
                </span>
              </th>
              {techs.map((tech) => (
                <th scope="col" key={tech.id} className={TH}>
                  <span className="inline-flex flex-wrap items-center gap-2 font-semibold">
                    <span
                      className={`h-2 w-2 rounded-full tone-fill-${tech.tone}`}
                      aria-hidden="true"
                    />
                    {localize(tech.name, lang)}
                    {tech.id === comparison.chosenTechId ? (
                      <span className="kind-badge">{t('compare.chosen')}</span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparison.criteria.map((criterion) => (
              <tr key={criterion.id}>
                <th scope="row" className={TH}>
                  <span className="block font-semibold">{localize(criterion.name, lang)}</span>
                  <span className="topic-chip mt-1">
                    {t('compare.weight', { value: criterion.weight })}
                  </span>
                </th>
                {techs.map((tech) => {
                  const score = criterion.scores[tech.id];
                  return (
                    <td key={tech.id} className={TD}>
                      {score ? (
                        <>
                          <span className="text-lg font-bold">{score.value}</span>
                          <span className="text-xs text-fg-muted">/10</span>
                          {score.note ? (
                            <p className="mt-1 text-xs leading-5 text-fg-muted">
                              {localize(score.note, lang)}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className={`${TH} font-semibold`}>
                {t('compare.weightedTotal')}
              </th>
              {techs.map((tech) => (
                <td key={tech.id} className={`${TD} text-lg font-bold`}>
                  {weightedScore(comparison, tech.id)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function TechQualities({ techs, lang }: { techs: TechProfile[]; lang: string }) {
  const { t } = useTranslation();
  const count = techs.length;
  return (
    <section aria-labelledby="compare-qualities" className="space-y-4">
      <h2 id="compare-qualities" className="text-2xl font-bold">
        {t('compare.qualities')}
      </h2>
      <ul
        className={`mx-auto grid w-full list-none justify-center gap-4 p-0 ${
          count === 1
            ? 'max-w-4xl grid-cols-1'
            : count === 2
              ? 'max-w-6xl grid-cols-1 md:grid-cols-2'
              : count === 3
                ? 'max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {techs.map((tech) => (
          <li key={tech.id} className="surface-card h-full p-6">
            <div className="flex items-center gap-3">
              <span className={`icon-tile tone-${tech.tone}`} aria-hidden="true">
                <Scale />
              </span>
              <h3 className="font-bold">{localize(tech.name, lang)}</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-fg-muted">{localize(tech.summary, lang)}</p>
            <h4 className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-success">
              {t('compare.strengths')}
            </h4>
            <ul className="mt-2 space-y-1.5">
              {tech.strengths.map((item) => (
                <li key={item.en} className="flex items-start gap-2 text-sm text-fg-secondary">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                  {localize(item, lang)}
                </li>
              ))}
            </ul>
            <h4 className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-fg-muted">
              {t('compare.limitations')}
            </h4>
            <ul className="mt-2 space-y-1.5">
              {tech.limitations.map((item) => (
                <li key={item.en} className="flex items-start gap-2 text-sm text-fg-secondary">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-hidden="true" />
                  {localize(item, lang)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FrictionSection({ techs, lang }: { techs: TechProfile[]; lang: string }) {
  const { t } = useTranslation();
  const count = techs.length;
  return (
    <section aria-labelledby="compare-friction" className="surface-card p-6">
      <div className="flex items-start gap-3">
        <span className="icon-tile bg-warning-soft text-warning" aria-hidden="true">
          <TriangleAlert />
        </span>
        <div>
          <h2 id="compare-friction" className="text-2xl font-bold">
            {t('compare.friction')}
          </h2>
          <p className="mt-1 text-sm text-fg-muted">{t('compare.frictionIntro')}</p>
        </div>
      </div>
      <ul
        className={`mt-5 mx-auto grid w-full list-none justify-center gap-4 p-0 ${
          count === 1
            ? 'max-w-4xl grid-cols-1'
            : count === 2
              ? 'max-w-6xl grid-cols-1 md:grid-cols-2'
              : count === 3
                ? 'max-w-7xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}
      >
        {techs.map((tech) => (
          <li key={tech.id} className="h-full">
            <h3 className="font-semibold">{localize(tech.name, lang)}</h3>
            <ul className="mt-2 space-y-1.5">
              {tech.friction.map((item) => (
                <li key={item.en} className="text-sm leading-6 text-fg-secondary">
                  {localize(item, lang)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConclusionSection({
  comparison,
  techs,
  lang,
}: {
  comparison: Comparison;
  techs: TechProfile[];
  lang: string;
}) {
  const { t } = useTranslation();
  const chosen = techs.find((tech) => tech.id === comparison.chosenTechId);
  return (
    <section aria-labelledby="compare-conclusion" className="surface-card p-6">
      <h2 id="compare-conclusion" className="text-2xl font-bold">
        {t('compare.conclusion')}
      </h2>
      {chosen ? (
        <p className="mt-3 inline-flex items-center gap-2 font-semibold text-primary">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          {t('compare.chosenTech', { name: localize(chosen.name, lang) })}
        </p>
      ) : null}
      <p className="mt-3 max-w-3xl text-sm leading-6 text-fg-secondary">
        {localize(comparison.conclusion, lang)}
      </p>
      <p className="mt-3 text-xs text-fg-muted">
        {comparison.revisitAt
          ? t('compare.revisit', { date: formatDate(comparison.revisitAt, lang) })
          : null}
      </p>
      <Link
        to="/decisions"
        className="mt-4 inline-flex min-h-6 items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
      >
        {t('compare.decisionLink')}
        <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
      </Link>
    </section>
  );
}

function EvidenceSection({ comparison }: { comparison: Comparison }) {
  const { t } = useTranslation();
  if ((comparison.evidence ?? []).length === 0) return null;
  return (
    <section aria-labelledby="compare-evidence" className="surface-card p-6">
      <h2 id="compare-evidence" className="text-2xl font-bold">
        {t('compare.evidence')}
      </h2>
      <ul className="mt-3 flex list-none flex-wrap gap-x-6 gap-y-2 p-0">
        {(comparison.evidence ?? []).map((item) => (
          <li key={item.url}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex min-h-6 items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              {item.label}
              <span className="sr-only"> ({t('compare.newTab')})</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
