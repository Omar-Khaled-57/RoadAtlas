import type {
  ID,
  Link,
  LocalizedString,
  PipelineStage,
  Roadmap,
  RoadmapKind,
  Step,
} from '@shared/index';

/**
 * Client-side demo dataset. The server model (see docs/decisions/0004) is not
 * wired up yet, so the catalog, map and detail views read from this single seed
 * to stay consistent with one another.
 */

export type RoadmapStatus = 'planned' | 'in-progress' | 'completed' | 'paused';

/** A `Step` plus the demo-only fields the UI needs before `Progress`/`Note` exist. */
export interface RoadmapStep extends Step {
  done: boolean;
  note?: LocalizedString;
}

export interface RoadmapSeed extends Roadmap {
  steps: RoadmapStep[];
  prerequisites: LocalizedString[];
  topics: LocalizedString[];
  paused?: boolean;
}

const OWNER = 'owner-demo';
const SEEN = '2026-01-01T09:00:00.000Z';

const t = (en: string, ar: string): LocalizedString => ({ en, ar });

interface StepInput {
  title: LocalizedString;
  description?: LocalizedString;
  done?: boolean;
  stage?: PipelineStage;
  note?: LocalizedString;
  resources?: Link[];
}

function makeStep(roadmapId: ID, index: number, input: StepInput): RoadmapStep {
  return {
    id: `${roadmapId}-s${index}`,
    ownerId: OWNER,
    roadmapId,
    title: input.title,
    description: input.description,
    resources: input.resources ?? [],
    order: index,
    stage: input.stage,
    done: input.done ?? false,
    note: input.note,
    createdAt: SEEN,
    updatedAt: SEEN,
  };
}

interface RoadmapInput {
  id: ID;
  kind: RoadmapKind;
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  parentId?: ID;
  paused?: boolean;
  prerequisites?: LocalizedString[];
  topics?: LocalizedString[];
  steps: StepInput[];
}

function makeRoadmap(input: RoadmapInput): RoadmapSeed {
  return {
    id: input.id,
    ownerId: OWNER,
    visibility: 'public',
    kind: input.kind,
    title: input.title,
    description: input.description,
    parentId: input.parentId,
    order: input.order,
    paused: input.paused,
    prerequisites: input.prerequisites ?? [],
    topics: input.topics ?? [],
    steps: input.steps.map((step, i) => makeStep(input.id, i + 1, step)),
    createdAt: SEEN,
    updatedAt: SEEN,
  };
}

export const seedRoadmaps: RoadmapSeed[] = [
  makeRoadmap({
    id: 'r-journey',
    kind: 'hub',
    order: 0,
    title: t('Engineering journey', 'رحلة الهندسة'),
    description: t(
      'How I learn and work — parallel technology tracks that branch, overlap and rejoin.',
      'كيف أتعلّم وأعمل — مسارات تقنية متوازية تتفرّع وتتقاطع وتلتقي.',
    ),
    topics: [t('Frontend', 'الواجهات'), t('Mobile', 'الجوال'), t('Backend', 'الخدمات الخلفية')],
    steps: [
      {
        title: t('Pick a track to go deep on', 'اختر مسارًا للتعمّق فيه'),
        description: t(
          'Choose one technology and resist the urge to sample everything at once.',
          'اختر تقنية واحدة وقاوم رغبة التجربة في كل شيء دفعة واحدة.',
        ),
        done: true,
      },
      {
        title: t('Study the fundamentals', 'ادرس الأساسيات'),
        done: true,
      },
      {
        title: t('Build one small real project', 'ابنِ مشروعًا حقيقيًا صغيرًا'),
        note: t(
          'A shipped toy beats ten tutorials that were never finished.',
          'مشروع صغير مُنجَز أفضل من عشرة دروس لم تُكمَل.',
        ),
      },
      {
        title: t('Write down what you learned', 'دوّن ما تعلّمته'),
        description: t(
          'Turn the project into notes so the next branch is faster.',
          'حوّل المشروع إلى ملاحظات لتكون الفترة التالية أسرع.',
        ),
      },
    ],
  }),
  makeRoadmap({
    id: 'r-electron',
    kind: 'tech',
    order: 0,
    parentId: 'r-journey',
    title: t('Electron', 'إلكترون'),
    description: t(
      'Desktop applications built with web technology — one codebase for Windows, macOS and Linux.',
      'تطبيقات سطح المكتب مبنية بتقنيات الويب — قاعدة شيفرة واحدة لويندوز وماك ولينكس.',
    ),
    prerequisites: [t('JavaScript', 'جافاسكربت'), t('Basic Node.js', 'أساسيات Node.js')],
    topics: [t('Desktop', 'سطح المكتب'), t('Packaging', 'التغليف')],
    steps: [
      { title: t('Main vs renderer processes', 'عمليتا Main وRenderer'), done: true },
      { title: t('IPC and preload scripts', 'قنوات IPC وسكربتات preload'), done: true },
      { title: t('Package and code-sign', 'التغليف وتوقيع الشيفرة'), done: true },
      { title: t('Auto-updates', 'التحديث التلقائي'), done: true },
    ],
  }),
  makeRoadmap({
    id: 'r-angular',
    kind: 'tech',
    order: 0,
    parentId: 'r-electron',
    title: t('Angular', 'أنغولار'),
    description: t(
      'A structured, opinionated front-end framework with dependency injection at its core.',
      'إطار واجهات منظّم ومحدّد الرأي، يقوم على حقن التبعيات.',
    ),
    prerequisites: [t('TypeScript', 'تايبسكربت'), t('HTML & CSS', 'HTML وCSS')],
    topics: [t('Frontend', 'الواجهات'), t('Architecture', 'البنية')],
    steps: [
      { title: t('Components and templates', 'المكوّنات والقوالب'), done: true },
      { title: t('Services and dependency injection', 'الخدمات وحقن التبعيات'), done: true },
      { title: t('Routing and guards', 'التوجيه والحُرّاس'), done: true },
      { title: t('RxJS streams and signals', 'تدفّقات RxJS والإشارات'), done: true },
      { title: t('Testing with the Angular harness', 'الاختبار بأدوات Angular'), done: true },
    ],
  }),
  makeRoadmap({
    id: 'r-mern',
    kind: 'tech',
    order: 0,
    parentId: 'r-angular',
    title: t('MERN', 'MERN'),
    description: t(
      'MongoDB, Express, React and Node — a full JavaScript stack from database to UI.',
      'مونغو وإكسبرس ورياكت ونود — حزمة جافاسكربت كاملة من قاعدة البيانات إلى الواجهة.',
    ),
    prerequisites: [t('JavaScript', 'جافاسكربت'), t('REST basics', 'أساسيات REST')],
    topics: [t('Full-stack', 'حزمة كاملة'), t('APIs', 'واجهات برمجية')],
    steps: [
      { title: t('Model data with Mongoose', 'نمذجة البيانات بـ Mongoose'), done: true },
      { title: t('Build Express REST endpoints', 'بناء نقاط REST في Express'), done: true },
      {
        title: t('React data flows and caching', 'تدفّق البيانات والتخزين المؤقت في رياكت'),
        done: true,
      },
      { title: t('Auth and sessions', 'المصادقة والجلسات'), done: true },
      {
        title: t('Deploy and monitor', 'النشر والمراقبة'),
        note: t(
          'Cut over behind a load balancer, then watch the error rate.',
          'انقل الخدمة خلف موازن حِمل ثم راقب معدّل الأخطاء.',
        ),
      },
    ],
  }),
  makeRoadmap({
    id: 'r-dotnet',
    kind: 'pipeline',
    order: 0,
    parentId: 'r-mern',
    paused: true,
    title: t('.NET', '.NET'),
    description: t(
      'Typed services and applications — taking one idea from concept to shipped.',
      'خدمات وتطبيقات مُهيّأة الأنواع — من الفكرة إلى الإطلاق.',
    ),
    prerequisites: [t('C# fundamentals', 'أساسيات C#')],
    topics: [t('Services', 'الخدمات'), t('Typed', 'الأنواع')],
    steps: [
      { title: t('Frame the idea', 'صياغة الفكرة'), stage: 'idea', done: true },
      {
        title: t('Design the service boundaries', 'تصميم حدود الخدمات'),
        stage: 'design',
        done: true,
      },
      { title: t('Build the core APIs', 'بناء الواجهات البرمجية الأساسية'), stage: 'build' },
      { title: t('Ship to staging', 'الإطلاق إلى بيئة الاختبار'), stage: 'ship' },
      { title: t('Post-launch review', 'مراجعة ما بعد الإطلاق'), stage: 'done' },
    ],
  }),
  makeRoadmap({
    id: 'r-atlas-web',
    kind: 'pipeline',
    order: 1,
    title: t('Marketing site revamp', 'تجديد موقع التسويق'),
    description: t(
      'Rebuild the public site on the new design system, from copy to launch.',
      'إعادة بناء الموقع العام على نظام التصميم الجديد، من النص حتى الإطلاق.',
    ),
    topics: [t('Web', 'الويب'), t('Design', 'التصميم')],
    steps: [
      { title: t('Audit the current site', 'تدقيق الموقع الحالي'), stage: 'idea', done: true },
      {
        title: t('Draft the new sitemap', 'مسودة خريطة الموقع الجديدة'),
        stage: 'design',
        done: true,
      },
      {
        title: t('Build the component library', 'بناء مكتبة المكوّنات'),
        stage: 'build',
        done: true,
      },
      { title: t('Migrate the content', 'ترحيل المحتوى'), stage: 'build' },
      { title: t('Launch and redirect', 'الإطلاق وإعادة التوجيه'), stage: 'ship' },
      { title: t('Monitor and iterate', 'المراقبة والتحسين'), stage: 'done' },
    ],
  }),
  makeRoadmap({
    id: 'r-atlas-mobile',
    kind: 'pipeline',
    order: 1,
    title: t('Companion mobile app', 'تطبيق الجوال المرافق'),
    description: t(
      'A pocket companion for tracking roadmaps on the go, from research to the stores.',
      'رفيق جيب لمتابعة خرائط الطريق أثناء التنقّل، من البحث إلى المتاجر.',
    ),
    prerequisites: [t('API access', 'الوصول إلى الواجهة البرمجية')],
    steps: [
      { title: t('Research user needs', 'بحث احتياجات المستخدم'), stage: 'idea' },
      { title: t('Sketch the key flows', 'رسم المسارات الأساسية'), stage: 'design' },
      { title: t('Ship a beta to testers', 'إطلاق نسخة تجريبية للمختبِرين'), stage: 'build' },
      { title: t('Store submission', 'الإرسال إلى المتاجر'), stage: 'ship' },
    ],
  }),
  makeRoadmap({
    id: 'r-flutter',
    kind: 'tech',
    order: 1,
    parentId: 'r-angular',
    title: t('Flutter', 'فلاتر'),
    description: t(
      'Cross-platform mobile UI from a single Dart codebase, drawn by its own engine.',
      'واجهات جوال متعددة المنصات من قاعدة Dart واحدة، يرسمها محرّكها الخاص.',
    ),
    prerequisites: [t('Dart basics', 'أساسيات Dart')],
    topics: [t('Mobile', 'الجوال'), t('UI', 'الواجهات')],
    steps: [
      { title: t('Widgets and layout', 'الودجات والتخطيط'), done: true },
      { title: t('State management', 'إدارة الحالة'), done: true },
      { title: t('Navigation and routing', 'التنقّل والتوجيه'), done: true },
      { title: t('Platform channels', 'قنوات المنصّة') },
    ],
  }),
  makeRoadmap({
    id: 'r-react-native',
    kind: 'tech',
    order: 0,
    parentId: 'r-flutter',
    title: t('React Native', 'رياكت نيتف'),
    description: t(
      'Native mobile apps written in React, bridging to platform APIs when needed.',
      'تطبيقات جوال أصلية مكتوبة بـ React، تتصل بواجهات المنصّة عند الحاجة.',
    ),
    prerequisites: [t('React', 'رياكت')],
    topics: [t('Mobile', 'الجوال'), t('React', 'رياكت')],
    steps: [
      { title: t('The bridge and JSI', 'الجسر وJSI') },
      { title: t('Navigation with a native feel', 'تنقّل بإحساس أصلي') },
      { title: t('Writing native modules', 'كتابة وحدات أصلية') },
      { title: t('Performance and lists', 'الأداء والقوائم') },
    ],
  }),
  makeRoadmap({
    id: 'r-kmp',
    kind: 'tech',
    order: 0,
    parentId: 'r-react-native',
    title: t('KMP', 'KMP'),
    description: t(
      'Kotlin Multiplatform — share business logic across Android, iOS and the web.',
      'كوتلن متعدد المنصات — شارِك منطق العمل بين أندرويد وiOS والويب.',
    ),
    prerequisites: [t('Kotlin', 'كوتلن'), t('Gradle', 'جرِيدل')],
    topics: [t('Mobile', 'الجوال'), t('Shared logic', 'منطق مشترك')],
    steps: [
      { title: t('Set up the shared module', 'إعداد الوحدة المشتركة'), done: true },
      { title: t('expect/actual for platform code', 'expect/actual لشيفرة المنصّة') },
      { title: t('iOS interoperability', 'التوافق مع iOS') },
      { title: t('Publishing the library', 'نشر المكتبة') },
    ],
  }),
];

export const PIPELINE_STAGES: PipelineStage[] = ['idea', 'design', 'build', 'ship', 'done'];

/** The stage of the first unfinished step, or the last stage once everything is done. */
export function currentStage(roadmap: RoadmapSeed): PipelineStage | undefined {
  const staged = roadmap.steps.filter((step) => step.stage);
  if (staged.length === 0) return undefined;
  const next = staged.find((step) => !step.done);
  return next?.stage ?? PIPELINE_STAGES[PIPELINE_STAGES.length - 1];
}

export function stageSteps(roadmap: RoadmapSeed, stage: PipelineStage): RoadmapStep[] {
  return roadmap.steps.filter((step) => step.stage === stage);
}

export function pipelineRoadmaps(): RoadmapSeed[] {
  return seedRoadmaps.filter((roadmap) => roadmap.kind === 'pipeline');
}

export function roadmapProgress(roadmap: RoadmapSeed): number {
  if (roadmap.steps.length === 0) return 0;
  const done = roadmap.steps.filter((step) => step.done).length;
  return Math.round((done / roadmap.steps.length) * 100);
}

export function roadmapStatus(roadmap: RoadmapSeed): RoadmapStatus {
  if (roadmap.paused) return 'paused';
  const progress = roadmapProgress(roadmap);
  if (progress >= 100) return 'completed';
  if (progress <= 0) return 'planned';
  return 'in-progress';
}

/** Lightweight shape for the map and other views that only need the gist. */
export interface RoadmapSummary {
  id: ID;
  kind: RoadmapKind;
  title: LocalizedString;
  progress: number;
  stepCount: number;
}

export function roadmapSummary(roadmap: RoadmapSeed): RoadmapSummary {
  return {
    id: roadmap.id,
    kind: roadmap.kind,
    title: roadmap.title,
    progress: roadmapProgress(roadmap),
    stepCount: roadmap.steps.length,
  };
}

export function getRoadmap(id: ID | undefined): RoadmapSeed | undefined {
  return id ? seedRoadmaps.find((roadmap) => roadmap.id === id) : undefined;
}

export function childRoadmaps(id: ID): RoadmapSeed[] {
  return seedRoadmaps
    .filter((roadmap) => roadmap.parentId === id)
    .sort((a, b) => a.order - b.order);
}
