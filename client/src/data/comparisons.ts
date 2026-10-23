import type { Comparison, ID, Link, LocalizedString } from '@shared/index';

/**
 * Client-side demo dataset for the comparison page. Like `roadmaps.ts`, the
 * server model (docs/decisions/0004) is not wired up yet, so the page reads
 * from this seed. Criteria are data, not hardcoded columns.
 */

type Tone = 'primary' | 'secondary' | 'accent';

/** A candidate technology with the localized fields the comparison view needs. */
export interface TechProfile {
  id: ID;
  name: LocalizedString;
  tone: Tone;
  summary: LocalizedString;
  strengths: LocalizedString[];
  limitations: LocalizedString[];
  /** Complexity/UI-curve findings — what only appears once a project gets deep. */
  friction: LocalizedString[];
}

export interface ComparisonSeed extends Omit<Comparison, 'conclusion'> {
  conclusion: LocalizedString;
  chosenTechId: ID;
  revisitAt: string;
  evidence: Link[];
}

const OWNER = 'owner-demo';
const SEEN = '2026-01-01T09:00:00.000Z';

const t = (en: string, ar: string): LocalizedString => ({ en, ar });

export const seedTechProfiles: TechProfile[] = [
  {
    id: 't-react-native',
    name: t('React Native', 'رياكت نيتف'),
    tone: 'primary',
    summary: t(
      'Native mobile apps written in React, reusing your existing data-fetching knowledge.',
      'تطبيقات جوال أصلية مكتوبة بـ React، تعيد استخدام معرفتك الحالية بجلب البيانات.',
    ),
    strengths: [
      t('Familiar React component and hooks model', 'نموذج مكوّنات React والخطّافات المألوف'),
      t(
        'Large ecosystem and a smooth server-state workflow',
        'منظومة واسعة وسير عمل سلس لبيانات الخادم',
      ),
      t('Fast iteration for UI-heavy screens', 'تكرار سريع للشاشات كثيفة الواجهة'),
    ],
    limitations: [
      t(
        'Bridge/JSI boundary causes platform-specific quirks',
        'حدّ الجسر/JSI يسبّب فروقًا خاصة بكل منصّة',
      ),
      t(
        'You still write native modules for deep platform work',
        'ما زلت تكتب وحدات أصلية للأعمال المنصّية العميقة',
      ),
    ],
    friction: [
      t(
        'Long, data-heavy lists stay smooth only with careful virtualisation and memoisation.',
        'القوائم الطويلة كثيفة البيانات تبقى سلسة فقط مع افتراض واضح وتخزين مؤقّت دقيق.',
      ),
      t(
        'Performance and layout parity across Android and iOS needs explicit attention.',
        'تكافؤ الأداء والتخطيط بين أندرويد وiOS يحتاج انتباهًا صريحًا.',
      ),
    ],
  },
  {
    id: 't-kmp',
    name: t('Kotlin Multiplatform', 'كوتلن متعدد المنصات'),
    tone: 'secondary',
    summary: t(
      'Share business and data logic in Kotlin while keeping native presentation layers.',
      'شارِك منطق العمل والبيانات بكوتلن مع إبقاء طبقات العرض الأصلية.',
    ),
    strengths: [
      t(
        'Share complex data and domain logic without dictating the UI',
        'مشاركة منطق البيانات والنطاق دون فرض الواجهة',
      ),
      t(
        'Type-safe Kotlin across Android, iOS and the web',
        'كوتلن آمن الأنواع عبر أندرويد وiOS والويب',
      ),
      t('Native UI stays native on each platform', 'تبقى الواجهة أصلية في كل منصّة'),
    ],
    limitations: [
      t('Smaller ecosystem than React or Flutter', 'منظومة أصغر من React أو Flutter'),
      t('iOS tooling and build setup add friction', 'أدوات iOS وإعداد البناء يضيفان احتكاكًا'),
    ],
    friction: [
      t(
        'expect/actual boundaries and platform interop add moving parts as the shared surface grows.',
        'حدود expect/actual والتوافق بين المنصّات تزيد الأجزاء المتحرّكة مع نمو السطح المشترك.',
      ),
      t(
        'You maintain separate UIs, so screen work is not shared.',
        'تحتفظ بواجهات منفصلة، فلا تُشارَك أعمال الشاشات.',
      ),
    ],
  },
  {
    id: 't-flutter',
    name: t('Flutter', 'فلاتر'),
    tone: 'accent',
    summary: t(
      'One Dart codebase drawing pixel-consistent UI with its own rendering engine.',
      'قاعدة شيفرة Dart واحدة ترسم واجهة متّسقة البكسل بمحرّك رسم خاص.',
    ),
    strengths: [
      t(
        'Consistent, pixel-precise UI on every platform',
        'واجهة متّسقة ودقيقة البكسل على كل منصّة',
      ),
      t('Rich built-in widget set and theming', 'مجموعة ودجات غنية مدمجة مع السمات'),
      t('Share UI and logic from a single codebase', 'مشاركة الواجهة والمنطق من قاعدة شيفرة واحدة'),
    ],
    limitations: [
      t(
        'Deep widget trees and layout constraints get verbose',
        'شجرات الودجات العميقة وقيود التخطيط تصبح مطوّلة',
      ),
      t(
        'Dart ecosystem is separate from your React knowledge',
        'منظومة Dart منفصلة عن معرفتك بـ React',
      ),
    ],
    friction: [
      t(
        'Continuous data updates, state management and rebuilds interact in ways that only show up once screens get complex.',
        'تفاعل التحديثات المستمرة وإدارة الحالة وإعادة البناء لا يظهر إلا عندما تتعقّد الشاشات.',
      ),
      t(
        'Custom, data-heavy screens take more layout plumbing than they first appear to.',
        'الشاشات المخصّصة كثيفة البيانات تتطلّب تخطيطًا أكثر مما تبدو عليه أولًا.',
      ),
    ],
  },
];

export const seedComparisons: ComparisonSeed[] = [
  {
    id: 'c-cross-platform',
    ownerId: OWNER,
    visibility: 'public',
    title: t('Cross-platform mobile in 2026', 'تطبيقات الجوال متعددة المنصّات في 2026'),
    candidateTechIds: ['t-react-native', 't-kmp', 't-flutter'],
    chosenTechId: 't-react-native',
    revisitAt: '2026-07-01',
    criteria: [
      {
        id: 'cr-code-sharing',
        name: t('Code shared across platforms', 'الشيفرة المشتركة بين المنصّات'),
        weight: 3,
        scores: {
          't-react-native': {
            value: 7,
            note: t(
              'UI and logic both in TS; platform work needs native modules.',
              'الواجهة والمنطق بـ TypeScript، والعمل المنصّي يحتاج وحدات أصلية.',
            ),
          },
          't-kmp': {
            value: 9,
            note: t(
              'Shares business/data logic; keeps native UIs separate.',
              'يشارك منطق العمل والبيانات مع إبقاء الواجهات الأصلية منفصلة.',
            ),
          },
          't-flutter': {
            value: 8,
            note: t('Shares almost everything through Dart.', 'يشارك كل شيء تقريبًا عبر Dart.'),
          },
        },
      },
      {
        id: 'cr-ecosystem',
        name: t('Ecosystem & community', 'المنظومة والمجتمع'),
        weight: 3,
        scores: {
          't-react-native': {
            value: 9,
            note: t('Vast, React-aligned tooling.', 'أدوات واسعة متوافقة مع React.'),
          },
          't-kmp': { value: 6, note: t('Growing but narrower.', 'نامية لكن أضيق.') },
          't-flutter': {
            value: 8,
            note: t('Large, self-contained ecosystem.', 'منظومة كبيرة مكتفية بذاتها.'),
          },
        },
      },
      {
        id: 'cr-tooling',
        name: t('Tooling & developer experience', 'الأدوات وتجربة المطوّر'),
        weight: 3,
        scores: {
          't-react-native': {
            value: 8,
            note: t('Familiar JS/TS workflow and debuggers.', 'سير عمل JS/TS مألوف وأدوات تصحيح.'),
          },
          't-kmp': {
            value: 7,
            note: t(
              'Great in Android Studio; iOS setup is harder.',
              'ممتاز في Android Studio، وإعداد iOS أصعب.',
            ),
          },
          't-flutter': {
            value: 8,
            note: t('Cohesive SDK and hot reload.', 'مجموعة SDK متكاملة مع إعادة التحميل الفوري.'),
          },
        },
      },
      {
        id: 'cr-performance',
        name: t('Native performance', 'الأداء الأصلي'),
        weight: 2,
        scores: {
          't-react-native': {
            value: 7,
            note: t('Good with care around the bridge.', 'جيد مع العناية بالجسر.'),
          },
          't-kmp': {
            value: 9,
            note: t('Compiled Kotlin and native UI.', 'كوتلن مُصرّف وواجهة أصلية.'),
          },
          't-flutter': {
            value: 8,
            note: t('Own engine; smooth and predictable.', 'محرّك خاص، سلس ومتوقّع.'),
          },
        },
      },
      {
        id: 'cr-ui',
        name: t('UI consistency & customisation', 'اتساق الواجهة وتخصيصها'),
        weight: 2,
        scores: {
          't-react-native': {
            value: 7,
            note: t(
              'Native look per platform; parity takes work.',
              'مظهر أصلي لكل منصّة، والتكافؤ يحتاج جهدًا.',
            ),
          },
          't-kmp': { value: 6, note: t('You build each UI natively.', 'تبني كل واجهة أصليًا.') },
          't-flutter': {
            value: 10,
            note: t('Pixel-identical across platforms.', 'متماثل بالبكسل عبر المنصّات.'),
          },
        },
      },
      {
        id: 'cr-maintenance',
        name: t('Long-term maintenance', 'الصيانة طويلة المدى'),
        weight: 1,
        scores: {
          't-react-native': {
            value: 7,
            note: t('Fast-moving deps to track.', 'تبعيات سريعة التغيّر تحتاج متابعة.'),
          },
          't-kmp': { value: 8, note: t('Stable, explicit boundaries.', 'مستقر بحدود صريحة.') },
          't-flutter': {
            value: 7,
            note: t(
              'Stable core; big widget trees cost upkeep.',
              'نواة مستقرة، لكن الشجرات الكبيرة تكلّف صيانة.',
            ),
          },
        },
      },
    ],
    conclusion: t(
      'React Native wins for this project: it reuses a familiar React workflow and a broad ecosystem, so UI-heavy features ship fast. Flutter scores slightly higher on the table, but its hidden friction — deep widget trees and data-heavy custom screens — only shows up once a project gets complex. Keep Kotlin Multiplatform in reserve: if shared data and business logic grow, it can take over that layer without forcing a native-UI rewrite.',
      'يفوز رياكت نيتف لهذا المشروع: يعيد استخدام سير عمل React المألوف ومنظومة واسعة، فتُسلَّم الميزات كثيفة الواجهة بسرعة. يتقدّم فلاتر قليلًا في الجدول، لكن احتكاكه الخفي — شجرات الودجات العميقة والشاشات المخصّصة كثيفة البيانات — لا يظهر إلا عندما يتعقّد المشروع. أبقِ كوتلن متعدد المنصّات احتياطيًا: إذا نمت البيانات والمنطق المشترك، يمكنه تولّي تلك الطبقة دون فرض إعادة كتابة الواجهة الأصلية.',
    ),
    evidence: [
      { label: 'reactnative.dev', url: 'https://reactnative.dev/' },
      { label: 'Kotlin Multiplatform', url: 'https://kotlinlang.org/docs/multiplatform.html' },
      { label: 'flutter.dev', url: 'https://flutter.dev/' },
    ],
    createdAt: SEEN,
    updatedAt: SEEN,
  },
];

export function getComparison(id: ID | undefined): ComparisonSeed | undefined {
  return id ? seedComparisons.find((comparison) => comparison.id === id) : seedComparisons[0];
}

export function getTechProfile(id: ID): TechProfile | undefined {
  return seedTechProfiles.find((tech) => tech.id === id);
}

/** Weighted average (0-10) of a tech's criterion scores, or 0 when it has none. */
export function weightedScore(comparison: ComparisonSeed, techId: ID): number {
  let total = 0;
  let weight = 0;
  for (const criterion of comparison.criteria) {
    const score = criterion.scores[techId];
    if (!score) continue;
    total += score.value * criterion.weight;
    weight += criterion.weight;
  }
  return weight === 0 ? 0 : Math.round((total / weight) * 10) / 10;
}
