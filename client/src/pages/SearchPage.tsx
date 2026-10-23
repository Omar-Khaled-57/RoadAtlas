import { Search as SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { Link } from 'react-router-dom';
import { seedComparisons, seedTechProfiles } from '../data/comparisons';
import { seedMetrics } from '../data/curves';
import { seedRoadmaps } from '../data/roadmaps';
import {
  useOwnerDecisions,
  useOwnerNotes,
  usePublicDecisions,
  usePublicNotes,
  useSession,
} from '../data/queries';
import { localize } from '../lib/localize';
import type { DecisionRecord, Note } from '@shared/index';

type EntityType = 'roadmap' | 'step' | 'tech' | 'comparison' | 'curve' | 'note' | 'decision';

const TYPES: EntityType[] = ['roadmap', 'step', 'tech', 'comparison', 'curve', 'note', 'decision'];

interface ResultItem {
  id: string;
  type: EntityType;
  title: string;
  subtitle?: string;
  href: string;
}

const INPUT_CLASS =
  'w-full rounded-xl border border-border-default bg-surface-solid px-4 py-3 text-start text-sm text-fg-primary outline-none transition placeholder:text-fg-muted focus:border-border-focus focus:ring-2 focus:ring-primary-soft';

/** Case/diacritic-insensitive matching for English and Arabic. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

export default function SearchPage() {
  usePageMeta({ titleKey: 'seo.search.title', descriptionKey: 'seo.search.description' });
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<EntityType | 'all'>('all');

  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const { data: publicNotes = [] } = usePublicNotes();
  const { data: ownerNotes = [] } = useOwnerNotes(authenticated);
  const { data: publicDecisions = [] } = usePublicDecisions();
  const { data: ownerDecisions = [] } = useOwnerDecisions(authenticated);

  const notes = useMemo(() => {
    const seen = new Set<string>();
    return [...publicNotes, ...ownerNotes].filter((note: Note) => {
      if (seen.has(note.id)) return false;
      seen.add(note.id);
      return true;
    });
  }, [ownerNotes, publicNotes]);

  const decisions = useMemo(() => {
    const seen = new Set<string>();
    return [...publicDecisions, ...ownerDecisions].filter((record: DecisionRecord) => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
  }, [ownerDecisions, publicDecisions]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];

    const match = (...values: Array<string | undefined>) =>
      values.some((value) => value && normalize(value).includes(q));

    const items: ResultItem[] = [];

    for (const roadmap of seedRoadmaps) {
      const title = localize(roadmap.title, lang);
      const desc = localize(roadmap.description, lang);
      const topics = roadmap.topics.map((topic) => localize(topic, lang));
      if (match(title, desc, ...topics)) {
        items.push({
          id: `roadmap-${roadmap.id}`,
          type: 'roadmap',
          title,
          subtitle: desc,
          href: `/roadmaps/${roadmap.id}`,
        });
      }
      for (const step of roadmap.steps) {
        const stepTitle = localize(step.title, lang);
        const stepDesc = localize(step.description, lang);
        const stepNote = localize(step.note, lang);
        if (match(stepTitle, stepDesc, stepNote)) {
          items.push({
            id: `step-${step.id}`,
            type: 'step',
            title: stepTitle,
            subtitle: title,
            href: `/roadmaps/${roadmap.id}`,
          });
        }
      }
    }

    for (const tech of seedTechProfiles) {
      const name = localize(tech.name, lang);
      const summary = localize(tech.summary, lang);
      const details = [...tech.strengths, ...tech.limitations, ...tech.friction].map((item) =>
        localize(item, lang),
      );
      if (match(name, summary, ...details)) {
        items.push({
          id: `tech-${tech.id}`,
          type: 'tech',
          title: name,
          subtitle: summary,
          href: '/compare',
        });
      }
    }

    for (const comp of seedComparisons) {
      const title = localize(comp.title, lang);
      const criteria = comp.criteria.map((criterion) => localize(criterion.name, lang));
      if (match(title, ...criteria)) {
        items.push({
          id: `comparison-${comp.id}`,
          type: 'comparison',
          title,
          href: '/compare',
        });
      }
    }

    for (const metric of seedMetrics) {
      const label = localize(metric.axis.label, lang);
      const finding = localize(metric.finding, lang);
      if (match(label, finding)) {
        items.push({
          id: `metric-${metric.id}`,
          type: 'curve',
          title: label,
          subtitle: finding,
          href: '/curves',
        });
      }
    }

    for (const note of notes) {
      const title = localize(note.title, lang);
      const content = localize(note.content, lang);
      if (match(title, content, note.targetId, ...note.tags, ...note.references)) {
        items.push({
          id: `note-${note.id}`,
          type: 'note',
          title,
          subtitle: note.tags.length > 0 ? note.tags.join(' · ') : note.targetId,
          href: `/knowledge/${note.id}`,
        });
      }
    }

    for (const record of decisions) {
      const decision = localize(record.decision, lang);
      const context = localize(record.context, lang);
      const consequences = localize(record.consequences, lang);
      const alternatives = record.alternatives.map((alt) => localize(alt, lang));
      if (match(decision, context, consequences, ...alternatives)) {
        items.push({
          id: `decision-${record.id}`,
          type: 'decision',
          title: decision,
          subtitle: context,
          href: `/decisions/${record.id}`,
        });
      }
    }

    return filter === 'all' ? items : items.filter((item) => item.type === filter);
  }, [decisions, filter, lang, notes, query]);

  return (
    <div className="page-enter space-y-6">
      <header>
        <p className="section-eyebrow">{t('search.eyebrow')}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('search.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-fg-muted">{t('search.subtitle')}</p>
      </header>

      <section className="surface-card space-y-4 p-4 sm:p-5" aria-label={t('search.filters')}>
        <div className="relative">
          <SearchIcon
            className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${INPUT_CLASS} ps-11`}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="me-1 text-xs font-semibold uppercase tracking-[.14em] text-fg-muted">
            {t('search.filterType')}
          </span>
          <div role="group" aria-label={t('search.filterType')} className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={filter === 'all'}
              className={`filter-chip${filter === 'all' ? ' is-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {t('search.all')}
            </button>
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={filter === type}
                className={`filter-chip${filter === type ? ' is-active' : ''}`}
                onClick={() => setFilter(type)}
              >
                {t(`search.type.${type}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!query.trim() ? (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-primary-soft text-primary">
            <SearchIcon aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">{t('search.emptyQuery.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            {t('search.emptyQuery.body')}
          </p>
        </section>
      ) : results.length === 0 ? (
        <section className="surface-card p-10 text-center">
          <span className="icon-tile mx-auto bg-warning-soft text-warning">
            <SearchIcon aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-bold">{t('search.empty.title')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">{t('search.empty.body')}</p>
        </section>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">{t('search.results', { value: results.length })}</p>
          <div className="grid gap-2">
            {results.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-surface-hover"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tag-chip">{t(`search.type.${item.type}`)}</span>
                    <p className="font-semibold">{item.title}</p>
                  </div>
                  {item.subtitle ? (
                    <p className="line-clamp-2 text-sm text-fg-muted">{item.subtitle}</p>
                  ) : null}
                </div>
                <span className="secondary-button">{t('search.go')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
