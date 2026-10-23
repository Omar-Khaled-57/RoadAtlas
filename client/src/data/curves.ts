import type { ID, LocalizedString, Metric } from '@shared/index';

/**
 * Client-side demo dataset for the curves page. Mirrors comparisons.ts pattern:
 * no server wiring yet; page reads from this seed.
 */
export interface TechCurve {
  id: ID;
  name: LocalizedString;
  tone: 'primary' | 'secondary' | 'accent' | 'surface';
}

const OWNER = 'owner-demo';
const SEEN = '2026-01-01T09:00:00.000Z';

const t = (en: string, ar: string): LocalizedString => ({ en, ar });

export const seedTechCurves: TechCurve[] = [
  {
    id: 't-react-native',
    name: t('React Native', 'رياكت نيتف'),
    tone: 'primary',
  },
  {
    id: 't-kmp',
    name: t('Kotlin Multiplatform', 'كوتلن متعدد المنصات'),
    tone: 'secondary',
  },
  {
    id: 't-flutter',
    name: t('Flutter', 'فلاتر'),
    tone: 'accent',
  },
];

const makeMetric = (
  id: ID,
  techId: ID,
  key: string,
  axis: { en: string; ar: string; unit?: string },
  points: Array<[number, number]>,
  finding: { en: string; ar: string },
): Metric => ({
  id,
  ownerId: OWNER,
  visibility: 'public',
  techId,
  key,
  axis: {
    key: axis.en.toLowerCase(),
    label: t(axis.en, axis.ar),
    unit: axis.unit,
  },
  points: points.map(([x, y]) => ({ x, y })),
  finding: t(finding.en, finding.ar),
  createdAt: SEEN,
  updatedAt: SEEN,
});

export const seedMetrics: Metric[] = [
  makeMetric(
    'm-learning-rn',
    't-react-native',
    'learning',
    { en: 'Proficiency', ar: 'الكفاءة', unit: '%' },
    [
      [0, 0],
      [20, 70],
      [40, 80],
      [60, 85],
      [80, 90],
      [100, 93],
    ],
    {
      en: 'Learning is fast initially (familiar React) but plateaus at deep platform work.',
      ar: 'التعلم سريع في البداية (React مألوف) لكن يتباطأ عند الأعمال المنصية العميقة.',
    },
  ),
  makeMetric(
    'm-complexity-rn',
    't-react-native',
    'complexity',
    { en: 'Complexity', ar: 'التعقيد', unit: 'level' },
    [
      [0, 1],
      [20, 2],
      [40, 3],
      [60, 4],
      [80, 6],
      [100, 7],
    ],
    {
      en: 'Complexity curve climbs steeply for the last 20% (bridges, native modules, upgrades).',
      ar: 'منحنى التعقيد يصعد حادًا في آخر 20٪ (الجسور، الوحدات الأصلية، التحديثات).',
    },
  ),
  makeMetric(
    'm-learning-kmp',
    't-kmp',
    'learning',
    { en: 'Proficiency', ar: 'الكفاءة', unit: '%' },
    [
      [0, 0],
      [20, 40],
      [40, 65],
      [60, 80],
      [80, 90],
      [100, 94],
    ],
    {
      en: 'Steeper start (Kotlin/interop) but reaches high proficiency with shared business logic.',
      ar: 'بداية أكثر صعوبة (كوتلن/توافق) لكن يصل لكفاءة عالية مع منطق الأعمال المشترك.',
    },
  ),
  makeMetric(
    'm-complexity-kmp',
    't-kmp',
    'complexity',
    { en: 'Complexity', ar: 'التعقيد', unit: 'level' },
    [
      [0, 2],
      [20, 3],
      [40, 4],
      [60, 5],
      [80, 5],
      [100, 6],
    ],
    {
      en: 'Complexity rises early but grows more gradually for large, shared codebases.',
      ar: 'التعقيد يرتفع مبكرًا لكنه ينمو بتدرج أكبر في قواعد الكود المشتركة الكبيرة.',
    },
  ),
  makeMetric(
    'm-learning-flutter',
    't-flutter',
    'learning',
    { en: 'Proficiency', ar: 'الكفاءة', unit: '%' },
    [
      [0, 0],
      [20, 60],
      [40, 75],
      [60, 83],
      [80, 88],
      [100, 91],
    ],
    {
      en: 'Consistent curve: widget model is learnable but Dart ecosystem differs from React.',
      ar: 'منحنى ثابت: نموذج الودجات سهل التعلم لكن بيئة دارت تختلف عن رياكت.',
    },
  ),
  makeMetric(
    'm-complexity-flutter',
    't-flutter',
    'complexity',
    { en: 'Complexity', ar: 'التعقيد', unit: 'level' },
    [
      [0, 2],
      [20, 3],
      [40, 4],
      [60, 5],
      [80, 6],
      [100, 8],
    ],
    {
      en: 'Complexity grows later when custom rendering, platform channels, or large widgets hit.',
      ar: 'التعقيد ينمو لاحقًا عند مصادفة عرض مخصص أو قنوات منصية أو ودجات كبيرة.',
    },
  ),
];

export interface CurveEvidence {
  url: string;
  label: LocalizedString;
}

export const evidenceLinks: CurveEvidence[] = [
  {
    url: 'https://opencode.ai',
    label: t('opencode docs', 'وثائق opencode'),
  },
];
