import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageMeta } from '../lib/seo';

import { ExternalLink, Sparkles } from 'lucide-react';
import { evidenceLinks, seedMetrics, seedTechCurves, type TechCurve } from '../data/curves';
import type { ID, LocalizedString } from '@shared/index';

const toneStroke: Record<TechCurve['tone'], string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  surface: 'var(--color-border-strong)',
};

export default function CurvesPage() {
  usePageMeta({ titleKey: 'seo.curves.title', descriptionKey: 'seo.curves.description' });
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  const availableMetrics = useMemo(() => {
    const seen = new Set<string>();
    const list: { key: string; label: LocalizedString }[] = [];
    for (const metric of seedMetrics) {
      if (seen.has(metric.key)) continue;
      seen.add(metric.key);
      list.push({ key: metric.key, label: metric.axis.label });
    }
    return list;
  }, []);

  const [activeMetric, setActiveMetric] = useState<ID>(() => availableMetrics[0]?.key ?? '');

  const techs = seedTechCurves;
  const techById = useMemo(() => new Map(techs.map((t) => [t.id, t])), [techs]);

  const series = useMemo(() => {
    const metrics = seedMetrics.filter((m) => m.key === activeMetric);
    return metrics.map((m) => ({
      metric: m,
      tech: techById.get(m.techId),
      data: m.points
        .slice()
        .sort((a, b) => a.x - b.x)
        .map((p) => ({ x: p.x, y: p.y })),
    }));
  }, [activeMetric, techById]);

  return (
    <div className="page-enter space-y-6" dir={dir} lang={isAr ? 'ar' : 'en'}>
      <header className="space-y-2">
        <span className="section-eyebrow">{t('curves.title')}</span>
        <h1 className="text-3xl font-bold tracking-tight">{t('curves.title')}</h1>
        <p className="max-w-2xl text-fg-muted">{t('curves.subtitle')}</p>
      </header>

      <section className="surface-card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t('curves.metricSwitcher')}</h2>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('curves.metricSwitcher')}
          >
            {availableMetrics.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`filter-chip ${activeMetric === key ? 'is-active' : ''}`}
                aria-pressed={activeMetric === key}
                onClick={() => setActiveMetric(key)}
              >
                {label[isAr ? 'ar' : 'en']}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="h-[320px] w-full">
              {series.length > 0 ? (
                <svg
                  className="h-full w-full"
                  role="img"
                  aria-label={t('curves.chartAria')}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <line
                      key={i}
                      x1="10%"
                      x2="90%"
                      y1={`${10 + i * 20}%`}
                      y2={`${10 + i * 20}%`}
                      stroke="var(--color-border-subtle)"
                      strokeDasharray="3 3"
                    />
                  ))}
                  {series.map((s) => {
                    const path = s.data
                      .map((p, idx) => {
                        const x = 10 + (p.x / 100) * 80;
                        const y = 90 - (p.y / 100) * 80;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ');
                    return (
                      <path
                        key={s.metric.id}
                        d={path}
                        fill="none"
                        stroke={s.tech ? toneStroke[s.tech.tone] : 'var(--color-primary)'}
                        strokeWidth={2}
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border-default bg-surface/40 p-6 text-center">
                  <div className="space-y-2">
                    <p className="font-medium">{t('curves.noMetrics')}</p>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        const first = availableMetrics[0];
                        if (first) setActiveMetric(first.key);
                      }}
                    >
                      {t('curves.cta')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-fg-muted">
              {t('curves.findings')}
            </h3>
            {series.map((s) => (
              <article
                key={s.metric.id}
                className="rounded-2xl border border-border-subtle bg-surface/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {s.tech?.name[isAr ? 'ar' : 'en'] ?? s.metric.techId}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {s.metric.axis.label[isAr ? 'ar' : 'en']}
                      {s.metric.axis.unit ? ` · ${s.metric.axis.unit}` : ''}
                    </p>
                  </div>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: s.tech ? toneStroke[s.tech.tone] : 'var(--color-primary)',
                    }}
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {s.metric.finding[isAr ? 'ar' : 'en']}
                </p>
              </article>
            ))}
          </aside>
        </div>
      </section>

      <section className="surface-card space-y-3 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-fg-muted" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{t('curves.series')}</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {techs.map((tech) => (
            <li
              key={tech.id}
              className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-sm"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: toneStroke[tech.tone] }}
                aria-hidden="true"
              />
              <span>{tech.name[isAr ? 'ar' : 'en']}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card space-y-3 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t('curves.evidence')}</h2>
        <ul className="space-y-2">
          {evidenceLinks.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm text-primary transition hover:underline"
              >
                {link.label[isAr ? 'ar' : 'en']}
                <ExternalLink className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
                <span className="sr-only">
                  {isAr ? '(يفتح في تبويب جديد)' : '(opens in new tab)'}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
