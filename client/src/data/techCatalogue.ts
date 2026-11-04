/**
 * Fixed technology catalogue — localized display copy keyed by `techId`.
 *
 * Data extracted from `../my-portfolio/dev/tech-tools.md` — the canonical
 * tech-tool reference for Omar Khaled El-Khouly's portfolio. Every entry is
 * a real tool from that stack, with real names, types, and image paths.
 *
 * This is *display metadata only* (names, summary, strengths/limitations/friction,
 * tone for chart colors). It is intentionally NOT comparison or metric data:
 * scored criteria, metric points, and findings all come from the server
 * (`Comparison` / `Metric` documents). Keeping profiles here satisfies ADR 0004's
 * open question #5 (technology profiles as fixed copy, no second owned collection)
 * without seeding any comparative data on the client.
 *
 * Every human-visible string is a `LocalizedString`; `ar` falls back to `en` at
 * render time via `lib/localize`.
 */

import type { ID, Link, LocalizedString } from '@shared/index';

export interface TechProfile {
  id: ID;
  name: LocalizedString;
  /** 'Main' | 'Other' from the portfolio tech-tools table. */
  category: 'Main' | 'Other';
  /** Chart / badge tone — maps to a semantic theme token, never a raw color. */
  tone: 'primary' | 'secondary' | 'accent' | 'surface';
  summary: LocalizedString;
  strengths: LocalizedString[];
  limitations: LocalizedString[];
  /** Hidden friction that only shows up once a project gets complex (research Turn 7). */
  friction: LocalizedString[];
  links: Link[];
}

const t = (en: string, ar: string): LocalizedString => ({ en, ar });

export const techProfiles: TechProfile[] = [
  {
    id: 't-html',
    name: t('HTML', 'إتش تي إم إل'),
    category: 'Main',
    tone: 'primary',
    summary: t(
      'Hypertext Markup Language — the standard markup language for documents designed to be displayed in a web browser.',
      'لغة توصيف النص التشعبي — لغة التوصيف القياسية للمستندات المصممة للعرض في متصفح الويب.',
    ),
    strengths: [
      t('Universal browser support', 'دعم عالمي من المتصفحات'),
      t('Simple to learn and write', 'بسيط للتعلم والكتابة'),
      t('Foundation of every web page', 'أساس كل صفحة ويب'),
    ],
    limitations: [
      t('No programming logic on its own', 'لا يحتوي على منطق برمجي بمفرده'),
      t('Requires CSS and JavaScript for interactivity', 'يحتاج إلى CSS و JavaScript للتفاعل'),
    ],
    friction: [
      t(
        'Managing large DOM structures becomes unwieldy without frameworks',
        'إدارة هياكل DOM الكبيرة تصبح صعبة دون أطر عمل',
      ),
    ],
    links: [
      {
        label: 'developer.mozilla.org/html',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
      },
    ],
  },
  {
    id: 't-css',
    name: t('CSS', 'سي إس إس'),
    category: 'Main',
    tone: 'primary',
    summary: t(
      'Cascading Style Sheets — a style sheet language used for describing the presentation of a document written in HTML.',
      'أوراق الأنماط المتتالية — لغة أوراق أنماط تُستخدم لوصف عرض مستند مكتوب بلغة HTML.',
    ),
    strengths: [
      t('Separates content from presentation', 'يفصل المحتوى عن العرض'),
      t('Responsive design with media queries', 'تصميم متجاوب باستخدام استعلامات الوسائط'),
      t(
        'Wide tooling ecosystem (preprocessors, frameworks)',
        'نظام أدوات واسع (معالجات أولية، أطر عمل)',
      ),
    ],
    limitations: [
      t(
        'Global namespace can cause style collisions',
        'فضاء الأسماء العالمي قد يسبب تصادم الأنماط',
      ),
      t('Complexity grows with project size', 'التعقيد ينمو مع حجم المشروع'),
    ],
    friction: [
      t(
        'Maintaining consistency across large codebases requires discipline',
        'الحفاظ على الاتساق عبر قواعد الكود الكبيرة يتطلب انضباطًا',
      ),
    ],
    links: [
      {
        label: 'developer.mozilla.org/css',
        url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
      },
    ],
  },
  {
    id: 't-javascript',
    name: t('JavaScript', 'جافاسكربت'),
    category: 'Main',
    tone: 'primary',
    summary: t(
      'A high-level, interpreted programming language that conforms to the ECMAScript specification — the programming language of the web.',
      'لغة برمجة عالية المستوى مفسرة تتماشى مع مواصفات إيكرا سكريبت — لغة برمجة الويب.',
    ),
    strengths: [
      t('Runs in every browser', 'ت运行 في كل متصفح'),
      t('Massive ecosystem (npm)', 'نظام بيئي ضخم (NPM)'),
      t('Full-stack capable with Node.js', 'قادرة على تطويرκο 전체 stack مع Node.js'),
    ],
    limitations: [
      t('Dynamic typing can hide bugs', 'الtyping الديناميكي قد يخفي الأخطاء'),
      t('Inconsistent behavior across browsers', 'سلوك غير متسق عبر المتصفحات'),
    ],
    friction: [
      t(
        'Asynchronous code and event loop are easy to misuse',
        'الكود غير المتزامن وحلقة الأحداث يسهل إساءة استخدامها',
      ),
    ],
    links: [
      {
        label: 'developer.mozilla.org/javascript',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      },
    ],
  },
  {
    id: 't-typescript',
    name: t('TypeScript', 'تايب سكربت'),
    category: 'Main',
    tone: 'primary',
    summary: t(
      'A strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
      'لغة برمجةтика قوية الأنواع تبني على JavaScript، وتمنحك أدوات أفضل على أي نطاق.',
    ),
    strengths: [
      t('Static type checking catches errors early', 'فحص الأنواع الثابت يلتقط الأخطاء مبكرًا'),
      t('Excellent IDE support and autocompletion', 'دعم IDE ممتاز وإكمال تلقائي'),
      t('Gradual adoption from JavaScript', 'تبني تدريجي من JavaScript'),
    ],
    limitations: [
      t('Build step required', 'يحتاج خطوة بناء'),
      t(
        'Learning curve for teams new to static types',
        'منحنى تعليمي لفرق جديدة على الأنواع الثابتة',
      ),
    ],
    friction: [
      t(
        'Type definitions for third-party libraries can be outdated or missing',
        'تعريفات الأنواع للمكتبات الخارجية قد تكون قديمة أو مفقودة',
      ),
    ],
    links: [{ label: 'typescriptlang.org', url: 'https://www.typescriptlang.org/' }],
  },
  {
    id: 't-react',
    name: t('React', 'رياكت'),
    category: 'Main',
    tone: 'primary',
    summary: t(
      'A free and open-source front-end JavaScript library for building user interfaces based on UI components.',
      'مكتبة JavaScript front-end مجانية ومفتوحة المصدر لبناء واجهات المستخدم بناءً على مكونات واجهة المستخدم.',
    ),
    strengths: [
      t('Component-based architecture', 'بنية قائمة على المكونات'),
      t('Huge ecosystem and community', 'نظام بيئي ومجتمع ضخمان'),
      t('Virtual DOM for efficient updates', 'DOM افتراضي للتحديثات الفعالة'),
    ],
    limitations: [
      t(
        'Fast-moving ecosystem with frequent breaking changes',
        'نظام بيئي سريع التغير مع تغييرات مكتبية متكررة',
      ),
      t('Boilerplate for state management', 'كود ابتدائي لإدارة الحالة'),
    ],
    friction: [
      t(
        'Managing complex state and side effects requires careful architecture',
        'إدارة الحالة المعقدة والآثار الجانبية تتطلب هندسة دقيقة',
      ),
    ],
    links: [{ label: 'react.dev', url: 'https://react.dev/' }],
  },
  {
    id: 't-tailwind',
    name: t('Tailwind', 'تايل ويند'),
    category: 'Main',
    tone: 'secondary',
    summary: t(
      'A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design.',
      'إطار عمل CSS يعطي الأولوية للفئاتUtils packed مع فئات مثل flex، pt-4، text-center و rotate-90 يمكن تركيبها لبناء أي تصميم.',
    ),
    strengths: [
      t('Rapid UI development', 'تطوير واجهة مستخدم سريع'),
      t('No context switching between HTML and CSS', 'لا الحاجة للتبديل بين HTML و CSS'),
      t('Highly customizable via tailwind.config', 'قابلة للتخصيص بشدة عبر tailwind.config'),
    ],
    limitations: [
      t(
        'HTML can become cluttered with many utility classes',
        'يمكن أن يصبح HTML مزدحمًا بفئات أداة عديدة',
      ),
      t('Learning the utility class names takes time', 'تعلم أسماء فئات الأدوات يستغرق وقتًا'),
    ],
    friction: [
      t('Debugging long class lists can be difficult', 'تصحيح قوائم الفئات الطويلة قد يكون صعبًا'),
    ],
    links: [{ label: 'tailwindcss.com', url: 'https://tailwindcss.com/' }],
  },
  {
    id: 't-nextjs',
    name: t('Next.js', 'نكست جي إس'),
    category: 'Main',
    tone: 'secondary',
    summary: t(
      'A React framework that enables functionality including server-side rendering and generating static websites for React based web applications.',
      'إطار React يوفر وظائف بما في ذلك العرض من جانب الخادم وإنشاء مواقع ثابتة لتطبيقات الويب القائمة على React.',
    ),
    strengths: [
      t(
        'Server-side rendering and static site generation',
        'العرض من جانب الخادم وإنشاء المواقع الثابتة',
      ),
      t('File-based routing', 'التوجيه بناءً على الملفات'),
      t('Built-in API routes', 'مسارات API مدمجة'),
    ],
    limitations: [
      t('Vendor lock-in with Vercel', 'اعتماد على مزود مع Vercel'),
      t('Complex configuration for advanced use cases', 'إعداد معقد لحالات الاستخدام المتقدمة'),
    ],
    friction: [
      t(
        'Server and client components mental model takes time to master',
        'نموذج عقلي للمكونات من جانب الخادم والعميل يستغرق وقتًا لإتقانه',
      ),
    ],
    links: [{ label: 'nextjs.org', url: 'https://nextjs.org/' }],
  },
  {
    id: 't-postgresql',
    name: t('PostgreSQL', 'بيري جري سول'),
    category: 'Main',
    tone: 'secondary',
    summary: t(
      'A free and open-source relational database management system emphasizing extensibility and SQL compliance.',
      'نظام إدارة قواعد بيانات علائقية مجاني ومفتوح المصدر يركز على القابلية للتوسعة والامتثال لـ SQL.',
    ),
    strengths: [
      t('ACID compliance and data integrity', 'الامتثال لـ ACID وسلامة البيانات'),
      t(
        'Advanced data types (JSON, arrays, ranges)',
        'أنواع بيانات متقدمة (JSON، المصفوفات، النطاقات)',
      ),
      t('Strong community and enterprise support', 'دعم مجتمعي ومؤسسي قوي'),
    ],
    limitations: [
      t('Can be overkill for simple projects', 'قد يكون مفرطًا للمشاريع البسيطة'),
      t('Vertical scaling has limits', 'للتوسع العمودي حدود'),
    ],
    friction: [
      t(
        'Complex queries and indexing require expertise',
        'الاستعلامات المعقدة والفهرسة تتطلب خبرة',
      ),
    ],
    links: [{ label: 'postgresql.org', url: 'https://www.postgresql.org/' }],
  },
  {
    id: 't-vite',
    name: t('Vite', 'فيت'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A build tool that aims to provide a faster and leaner development experience for modern web projects.',
      'أداة بناء تهدف إلى توفير تجربة تطوير أسرع وأخف للنماذج الحديثة للمشاريع على الويب.',
    ),
    strengths: [
      t('Fast cold start with native ESM', 'بدء بارد سريع مع ESM أصلي'),
      t('Hot module replacement that stays fast', 'استبدال الوحدات الساخنة الذي يظل سريعًا'),
      t('Simple configuration', 'إعداد بسيط'),
    ],
    limitations: [
      t('Smaller plugin ecosystem than Webpack', 'نظام إضافات أصغر من Webpack'),
      t('Less mature for legacy browser support', 'أقل نضجًا لدعم المتصفحات القديمة'),
    ],
    friction: [],
    links: [{ label: 'vitejs.dev', url: 'https://vitejs.dev/' }],
  },
  {
    id: 't-vue',
    name: t('Vue', 'فيو'),
    category: 'Main',
    tone: 'accent',
    summary: t(
      'An open-source model–view–viewmodel front end JavaScript framework for building user interfaces and single-page applications.',
      'إطار عمل JavaScript front-end مفتوح المصدر يعتمد نموذج العرض-النموذج-العرض لبناء واجهات المستخدم وتطبيقات الصفحة الواحدة.',
    ),
    strengths: [
      t('Gentle learning curve', 'منحنى تعليمي لطيف'),
      t('Clear separation of concerns', 'فصل واضح للمخاوف'),
      t('Excellent documentation', 'توثيق ممتاز'),
    ],
    limitations: [
      t('Smaller ecosystem than React', 'نظام بيئي أصغر من React'),
      t('Fewer job opportunities', 'فرص عمل أقل'),
    ],
    friction: [],
    links: [{ label: 'vuejs.org', url: 'https://vuejs.org/' }],
  },
  {
    id: 't-nodejs',
    name: t('Node.js', 'نود جي إس'),
    category: 'Main',
    tone: 'secondary',
    summary: t(
      'A free and open-source, cross-platform, back-end JavaScript runtime environment that runs on the V8 engine and executes JavaScript code outside a web browser.',
      'بيئة تشغيل JavaScript back-end مجانية ومفتوحة المصدر ومتعددة المنصات تعمل على محرك V8 وتنفذ كود JavaScript خارج متصفح الويب.',
    ),
    strengths: [
      t('JavaScript on the server', 'JavaScript على الخادم'),
      t('Non-blocking I/O for high concurrency', 'إدخال/إخراج غير غير معيق للتزامن العالي'),
      t('Massive npm ecosystem', 'نظام بيئي NPM ضخم'),
    ],
    limitations: [
      t('Single-threaded CPU bottlenecks', 'عقبات أحادية الخيط لوحدة المعالجة المركزية'),
      t('Callback hell without async/await', 'جحيم回调 بدون async/await'),
    ],
    friction: [
      t(
        'Managing versions and native modules can be tricky',
        'إدارة الإصدارات والوحدات الأصلية قد يكون صعبًا',
      ),
    ],
    links: [{ label: 'nodejs.org', url: 'https://nodejs.org/' }],
  },
  {
    id: 't-expressjs',
    name: t('Express.js', 'إكسبرس جي إس'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A back end web application framework for building RESTful APIs with Node.js.',
      'إطار عمل تطبيقات الويب من الخلفية لبناء واجهات برمجة تطبيقات RESTful مع Node.js.',
    ),
    strengths: [
      t('Minimalist and unopinionated', 'بسيط وغير متحيز'),
      t('Huge middleware ecosystem', 'نظام وسائط وسط ضخم'),
      t('Fast to build APIs', 'سريع لبناء واجهات API'),
    ],
    limitations: [
      t('No built-in structure for large apps', 'لا هيكل مدمج للتطبيقات الكبيرة'),
      t('Error handling can be inconsistent', 'معالجة الأخطاء قد تكون غير متسقة'),
    ],
    friction: [],
    links: [{ label: 'expressjs.com', url: 'https://expressjs.com/' }],
  },
  {
    id: 't-jwt',
    name: t('JWT', 'JWT'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'JSON Web Token — an open standard for securely transmitting information between parties as a JSON object.',
      'رمز الويب JSON — معيار مفتوح لنقل المعلومات بشكل آمن بين الأطراف ككائن JSON.',
    ),
    strengths: [
      t('Stateless authentication', 'مصادقة بلا حالة'),
      t('Compact and self-contained', 'مدمج ومستقل بذاته'),
      t('Works across domains', 'يعمل عبر المجالات'),
    ],
    limitations: [
      t('Cannot be revoked easily', 'لا يمكن إلغاؤه بسهولة'),
      t('Token size grows with payload', 'حجم الرمز يزداد مع الحمولة'),
    ],
    friction: [],
    links: [{ label: 'jwt.io', url: 'https://jwt.io/' }],
  },
  {
    id: 't-supabase',
    name: t('Supabase', 'سوبربيز'),
    category: 'Main',
    tone: 'secondary',
    summary: t(
      'An open-source Firebase alternative that provides database, authentication, and instant APIs.',
      'بديل مفتوح المصدر لـ Firebase يوفر قاعدة البيانات والمصادقة وواجهات برمجة التطبيقات الفورية.',
    ),
    strengths: [
      t('PostgreSQL under the hood', 'قواعد بيانات PostgreSQL تحت الغطاء'),
      t('Real-time subscriptions', 'اشتراكات في الوقت الفعلي'),
      t('Auto-generated APIs', 'واجهات برمجة تطبيقات يُنشأ تلقائيًا'),
    ],
    limitations: [
      t('Newer than Firebase, smaller community', 'أحدث من Firebase، مجتمع أصغر'),
      t('Self-hosting requires DevOps knowledge', 'الاستضافة الذاتية تتطلب معرفة DevOps'),
    ],
    friction: [],
    links: [{ label: 'supabase.com', url: 'https://supabase.com/' }],
  },
  {
    id: 't-firebase',
    name: t('Firebase', 'فايربيز'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A platform developed by Google for creating mobile and web applications.',
      'منصة طورتها Google لإنشاء تطبيقات الهاتف المحمول والويب.',
    ),
    strengths: [
      t('Backend-as-a-service with zero server management', '백-end كخدمة بدون إدارة خادم'),
      t('Real-time database', 'قاعدة بيانات في الوقت الفعلي'),
      t('Google ecosystem integration', 'تكامل مع نظام Google البيئي'),
    ],
    limitations: [
      t('Vendor lock-in', 'اعتماد على مزود'),
      t('Complex queries are limited', 'الاستعلامات المعقدة محدودة'),
    ],
    friction: [],
    links: [{ label: 'firebase.google.com', url: 'https://firebase.google.com/' }],
  },
  {
    id: 't-git',
    name: t('Git', 'جيت'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A free and open-source distributed version control system designed to handle everything from small to very large projects with speed and efficiency.',
      'نظام مراقبة إصدارات موزع مجاني ومفتوح المصدر مصمم للتعامل مع كل شيء من المشاريع الصغيرة إلى كبيرة جدًا بسرعة وكفاءة.',
    ),
    strengths: [
      t('Distributed version control', 'مراقبة إصدارات موزعة'),
      t('Branching and merging are powerful', 'الفروع والدمج قويان'),
      t('Industry standard', 'المعيار الصناعي'),
    ],
    limitations: [
      t('Steep learning curve for advanced features', 'منحنى تعليمي حاد للميزات المتقدمة'),
      t('Large binary files are problematic', 'الملفات الثنائية الكبيرة مشكلة'),
    ],
    friction: [],
    links: [{ label: 'git-scm.com', url: 'https://git-scm.com/' }],
  },
  {
    id: 't-vercel',
    name: t('Vercel', 'فرسيل'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A cloud platform for static sites and Serverless Functions that fits perfectly with Next.js.',
      'منصة سحابية للمواقع الثابتة ودوال Serverless التي تناسب تمامًا مع Next.js.',
    ),
    strengths: [
      t('Zero-config deployments', 'نشر بدون إعدادات'),
      t('Edge network for fast global delivery', 'شبكة حافة للتسليم السريع عالميًا'),
      t('Great developer experience', 'تجربة مطور ممتازة'),
    ],
    limitations: [
      t('Vendor lock-in', 'اعتماد على مزود'),
      t('Expensive at scale', 'مكلف على نطاق واسع'),
    ],
    friction: [],
    links: [{ label: 'vercel.com', url: 'https://vercel.com/' }],
  },
  {
    id: 't-sweetalert',
    name: t('SweetAlert', 'سويت أليرت'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A beautiful, responsive, customizable, and accessible replacement for JavaScript popup boxes.',
      'بديل جميل ومتجاوب وقابل للتخصيص ومت سهل الوصول لنوافذ المنبثقة JavaScript.',
    ),
    strengths: [
      t('Beautiful default styling', 'تنسيق افتراضي جميل'),
      t('Easy to use', 'سهل الاستخدام'),
      t('Accessible by default', 'مت سهل الوصول افتراضيًا'),
    ],
    limitations: [
      t('Adds bundle size', 'يزيد حجم الحزمة'),
      t('Another dependency to maintain', 'اعتماد إضافي للصيانة'),
    ],
    friction: [],
    links: [{ label: 'sweetalert2.github.io', url: 'https://sweetalert2.github.io/' }],
  },
  {
    id: 't-sonner',
    name: t('Sonner', 'سونر'),
    category: 'Main',
    tone: 'surface',
    summary: t('An opinionated toast component for React.', 'مكون إشعار متحيز لـ React.'),
    strengths: [
      t('Simple API', 'واجهة برمجة بسيطة'),
      t('Accessible', 'مت سهل الوصول'),
      t('Customizable', 'قابلة للتخصيص'),
    ],
    limitations: [
      t('React-only', 'لـ React فقط'),
      t('Smaller ecosystem than alternatives', 'نظام بيئي أصغر من البدائل'),
    ],
    friction: [],
    links: [{ label: 'sonner.emilkowal.ski', url: 'https://sonner.emilkowal.ski/' }],
  },
  {
    id: 't-framer-motion',
    name: t('Framer Motion', 'فرامر موشن'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'An open-source, production-ready motion library for React.',
      'مكتبة حركة مفتوحة المصدر وجاهزة للإنتاج لـ React.',
    ),
    strengths: [
      t('Declarative animations', 'رسوم متحركة تذكيرية'),
      t('Gesture and drag support', 'دعم الإيماءات والسحب'),
      t('Layout animations', 'رسوم متحركة للتخطيط'),
    ],
    limitations: [
      t('Adds bundle size', 'يزيد حجم الحزمة'),
      t(
        'Steeper learning curve for complex animations',
        'منحنى تعليمي حاد للرسوم المتحركة المعقدة',
      ),
    ],
    friction: [],
    links: [{ label: 'framer.com/motion', url: 'https://www.framer.com/motion/' }],
  },
  {
    id: 't-animejs',
    name: t('Anime.js', 'أنيمي جي إس'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'A lightweight JavaScript animation library with a simple, powerful API.',
      'مكتبة رسوم متحركة JavaScript خفيفة الوزن بواجهة برمجة بسيطة وقوية.',
    ),
    strengths: [
      t(
        'Works with CSS, SVG, DOM, and JavaScript objects',
        'يعمل مع CSS، SVG، DOM، وكائنات JavaScript',
      ),
      t('Small footprint', 'بصمة صغيرة'),
      t('Timeline control', 'تحكم في التسلسل الزمني'),
    ],
    limitations: [
      t('Smaller community than Framer Motion', 'مجتمع أصغر من Framer Motion'),
      t('Less React integration', 'تكامل أقل مع React'),
    ],
    friction: [],
    links: [{ label: 'animejs.com', url: 'https://animejs.com/' }],
  },
  {
    id: 't-i18next',
    name: t('i18next', 'آي 18 نكست'),
    category: 'Main',
    tone: 'surface',
    summary: t(
      'An internationalization framework for web and JavaScript applications.',
      'إطار عمل للتغليف الدولي لتطبيقات الويب و JavaScript.',
    ),
    strengths: [
      t('Powerful interpolation and pluralization', 'إدراج وتعديل صيغة الجمع قويان'),
      t('Many framework integrations', 'عديد من تكاملات الأطر'),
      t('Mature and battle-tested', 'ناضج ومختبر في المعارك'),
    ],
    limitations: [
      t('Configuration can be complex', 'الإعداد قد يكون معقدًا'),
      t('Large bundle if not tree-shaken', 'حزمة كبيرة إذا لم يتم إزالة الكود غير المستخدم'),
    ],
    friction: [],
    links: [{ label: 'i18next.com', url: 'https://www.i18next.com/' }],
  },
  {
    id: 't-material-ui',
    name: t('Material UI', 'ماتريال يو آي'),
    category: 'Main',
    tone: 'secondary',
    summary: t(
      "A comprehensive React UI component library that implements Google's Material Design.",
      'مكتبة مكونات واجهة مستخدم React شاملة تنفذ تصميم المواد من Google.',
    ),
    strengths: [
      t('Comprehensive component set', 'مجموعة مكونات شاملة'),
      t('Follows Material Design guidelines', 'يقوم بإرشادات تصميم المواد'),
      t('Theming support', 'دعم السمات'),
    ],
    limitations: [
      t('Can look generic if not customized', 'قد يبدو عامًا إذا لم يتم تخصيصه'),
      t('Large bundle size', 'حجم حزمة كبير'),
    ],
    friction: [],
    links: [{ label: 'mui.com', url: 'https://mui.com/' }],
  },
  {
    id: 't-cpp',
    name: t('C/C++', 'سي/سي بلس بلس'),
    category: 'Other',
    tone: 'surface',
    summary: t(
      'General-purpose programming languages known for performance and systems programming.',
      'لغات برمجة عامة conocidas بالأداء وبرمجة الأنظمة.',
    ),
    strengths: [
      t('Near-native performance', 'أداء قريب من الأصلي'),
      t('Manual memory management', 'إدارة ذاكرة يدوية'),
      t('Used in operating systems and game engines', 'تستخدم في أنظمة التشغيل ومحركات الألعاب'),
    ],
    limitations: [
      t('Manual memory management is error-prone', 'إدارة الذاكرة اليدوية عرضة للأخطاء'),
      t('Longer compile times', 'أوقات ترجمة أطول'),
    ],
    friction: [],
    links: [{ label: 'isocpp.org', url: 'https://isocpp.org/' }],
  },
  {
    id: 't-mysql',
    name: t('MySQL', 'ماي إس كيو إل'),
    category: 'Other',
    tone: 'surface',
    summary: t(
      'An open-source relational database management system.',
      'نظام إدارة قواعد بيانات علائقية مفتوح المصدر.',
    ),
    strengths: [
      t('Widely used and supported', 'مستخدم ومدعوم على نطاق واسع'),
      t('Fast for read-heavy workloads', 'سريع لأحمال العمل كثيفة القراءة'),
      t('Simple setup', 'إعداد بسيط'),
    ],
    limitations: [
      t('Fewer advanced features than PostgreSQL', 'ميزات متقدمة أقل من PostgreSQL'),
      t('Scaling writes can be challenging', 'توسيع الكتابة قد يكون صعبًا'),
    ],
    friction: [],
    links: [{ label: 'mysql.com', url: 'https://www.mysql.com/' }],
  },
  {
    id: 't-php',
    name: t('PHP', 'بي إتش بي'),
    category: 'Other',
    tone: 'surface',
    summary: t(
      'A general-purpose scripting language geared toward web development.',
      'لغة برمجة عامة موجهة لتطوير الويب.',
    ),
    strengths: [
      t('Powers a large portion of the web', 'تؤدي جزءًا كبيرًا من الويب'),
      t('Easy to deploy on shared hosting', 'سهل النشر على الاستضافة المشتركة'),
      t('Large ecosystem (WordPress, Laravel)', 'نظام بيئي كبير (WordPress, Laravel)'),
    ],
    limitations: [
      t('Inconsistent standard library', 'مكتبة قياسية غير متسقة'),
      t('Performance can lag behind modern alternatives', 'الأداء قد يتخلف عن البدائل الحديثة'),
    ],
    friction: [],
    links: [{ label: 'php.net', url: 'https://www.php.net/' }],
  },
  {
    id: 't-rust',
    name: t('Rust', 'راست'),
    category: 'Other',
    tone: 'accent',
    summary: t(
      'A multi-paradigm, general-purpose programming language that emphasizes performance, type safety, and concurrency.',
      'لغة برمجة عامة متعددة الأنماط تركز على الأداء وأمان الأنواع والتزامن.',
    ),
    strengths: [
      t('Memory safety without garbage collection', 'أمان الذاكرة دون جمع القمامة'),
      t('Fearless concurrency', 'التزامن بلا خوف'),
      t('Growing ecosystem', 'نظام بيئي نامي'),
    ],
    limitations: [
      t('Steep learning curve', 'منحنى تعليمي حاد'),
      t('Slower compile times', 'أوقات ترجمة أبطأ'),
    ],
    friction: [],
    links: [{ label: 'rust-lang.org', url: 'https://www.rust-lang.org/' }],
  },
  {
    id: 't-railway',
    name: t('Railway', 'ريل واي'),
    category: 'Other',
    tone: 'surface',
    summary: t(
      'A cloud platform to deploy infrastructure and apps with ease.',
      'منصة سحابية لنشر البنية التحتية والتطبيقات بسهولة.',
    ),
    strengths: [
      t('Simple infrastructure deployment', 'نشر بسيط للبنية التحتية'),
      t('Good developer experience', 'تجربة مطور جيدة'),
      t('Integrated databases and services', 'قواعد بيانات وخدمات مدمجة'),
    ],
    limitations: [
      t('Smaller than AWS/GCP/Azure', 'أصغر من AWS/GCP/Azure'),
      t('Vendor lock-in', 'اعتماد على مزود'),
    ],
    friction: [],
    links: [{ label: 'railway.app', url: 'https://railway.app/' }],
  },
  {
    id: 't-tauri',
    name: t('Tauri', 'تاوري'),
    category: 'Other',
    tone: 'accent',
    summary: t(
      'A framework for building tiny, fast binaries for all major desktop platforms using web frontend.',
      'إطار لبناء ملفات تنفيذية صغيرة وسريعة لجميع منصات سطح المكتب الرئيسية باستخدام واجهة ويب أمامية.',
    ),
    strengths: [
      t('Smaller binaries than Electron', 'ملفات تنفيذية أصغر من Electron'),
      t('Uses system webview', 'يستخدم عارض الويب للنظام'),
      t('Rust backend', 'خلفية Rust'),
    ],
    limitations: [
      t('Smaller ecosystem than Electron', 'نظام بيئي أصغر من Electron'),
      t('Rust knowledge needed for backend', 'معرفة Rust مطلوبة للخلفية'),
    ],
    friction: [],
    links: [{ label: 'tauri.app', url: 'https://tauri.app/' }],
  },
  {
    id: 't-kotlin',
    name: t('Kotlin', 'كوتلن'),
    category: 'Other',
    tone: 'secondary',
    summary: t(
      'A cross-platform, statically typed, general-purpose high-level programming language with type inference.',
      'لغة برمجة عالية المستوى متعددة المنصات، ثابتة الأنواع، عامة مع استنتاج الأنواع.',
    ),
    strengths: [
      t('Interoperable with Java', 'قابل للتشغيل البيني مع Java'),
      t('Null safety', 'آمان من 참조 فارغ'),
      t('Official language for Android', 'اللغة الرسمية لأندرويد'),
    ],
    limitations: [
      t('Slower compilation than Java', 'ترجمة أبطأ من Java'),
      t('Smaller community than Java', 'مجتمع أصغر من Java'),
    ],
    friction: [],
    links: [{ label: 'kotlinlang.org', url: 'https://kotlinlang.org/' }],
  },
  {
    id: 't-python',
    name: t('Python', 'بايثون'),
    category: 'Other',
    tone: 'secondary',
    summary: t(
      'A high-level, general-purpose programming language emphasizing code readability with significant indentation.',
      'لغة برمجة عالية المستوى عامة تركز على قراءة الكود مع مسافات بادئة هامة.',
    ),
    strengths: [
      t('Easy to read and write', 'سهل القراءة والكتابة'),
      t(
        'Massive ecosystem for data science and AI',
        'نظام بيئي ضخم للعلوم البيانية والذكاء الاصطناعي',
      ),
      t('Great for scripting and automation', 'عظيم للبرمجة النصية والأتمتة'),
    ],
    limitations: [
      t('Slower execution than compiled languages', 'تنفيذ أبطأ من اللغات المترجمة'),
      t('Global Interpreter Lock limits threading', 'قفل المفسر العام يحد من الخيوط'),
    ],
    friction: [],
    links: [{ label: 'python.org', url: 'https://www.python.org/' }],
  },
  {
    id: 't-keras',
    name: t('Keras', 'كيراس'),
    category: 'Other',
    tone: 'surface',
    summary: t(
      'An open-source Python library that provides a simple interface for artificial neural networks.',
      'مكتبة Python مفتوحة المصدر توفر واجهة بسيطة للشبكات العصبية الاصطناعية.',
    ),
    strengths: [
      t('User-friendly API', 'واجهة برمجة سهلة الاستخدام'),
      t('Runs on TensorFlow, JAX, or PyTorch', 'يعمل على TensorFlow أو JAX أو PyTorch'),
      t('Great for prototyping', 'عظيم للبرمجة الأولية'),
    ],
    limitations: [
      t('Less control than raw TensorFlow', 'تحكم أقل من TensorFlow الخام'),
      t('Smaller community than PyTorch', 'مجتمع أصغر من PyTorch'),
    ],
    friction: [],
    links: [{ label: 'keras.io', url: 'https://keras.io/' }],
  },
  {
    id: 't-tensorflow',
    name: t('TensorFlow', 'تينسور فلو'),
    category: 'Other',
    tone: 'surface',
    summary: t(
      'A free and open-source software library for machine learning and artificial intelligence.',
      'مكتبة برمجيات مجانية ومفتوحة المصدر لتعلم الآلة والذكاء الاصطناعي.',
    ),
    strengths: [
      t('Industry-standard for ML', 'المعيار الصناعي لـ ML'),
      t('Scalable to large clusters', 'قابلة للتوسع لمجموعات كبيرة'),
      t('TensorBoard for visualization', 'TensorBoard للتصور'),
    ],
    limitations: [
      t('Steep learning curve', 'منحنى تعليمي حاد'),
      t('Complex API', 'واجهة برمجة معقدة'),
    ],
    friction: [],
    links: [{ label: 'tensorflow.org', url: 'https://www.tensorflow.org/' }],
  },
  {
    id: 't-electron',
    name: t('Electron', 'إلكترون'),
    category: 'Other',
    tone: 'accent',
    summary: t(
      'A framework for building cross-platform desktop applications with JavaScript, HTML, and CSS.',
      'إطار لبناء تطبيقات سطح مكتب متعددة المنصات باستخدام JavaScript، HTML، و CSS.',
    ),
    strengths: [
      t('Web technologies for desktop', 'تقنيات الويب لسطح المكتب'),
      t('Cross-platform (Windows, macOS, Linux)', 'متعدد المنصات (Windows, macOS, Linux)'),
      t('Large ecosystem', 'نظام بيئي كبير'),
    ],
    limitations: [
      t('Large binary sizes', 'حجم ملفات تنفيذية كبير'),
      t('High memory usage', 'استخدام ذاكرة مرتفع'),
    ],
    friction: [
      t(
        'Performance and layout parity across platforms needs explicit attention',
        'تكافؤ الأداء والتخطيط عبر المنصات يحتاج اهتمامًا صريحًا',
      ),
    ],
    links: [{ label: 'electronjs.org', url: 'https://www.electronjs.org/' }],
  },
];

export const techById = new Map(techProfiles.map((tech) => [tech.id, tech]));

export function getTechProfile(id: ID): TechProfile | undefined {
  return techById.get(id);
}

export const mainTools = techProfiles.filter((t) => t.category === 'Main');
export const otherTools = techProfiles.filter((t) => t.category === 'Other');
