# 0003 — Information architecture & home page

**Status:** Proposed · **Date:** 2026-10-15

## Context

The home page direction is settled at a high level, but the **pages it links out to**, the exact
**routes**, and the **nav/footer labels** still need confirming before build. The product surfaces
(from [0001](./0001-project-scope.md)) are: hub roadmaps, per-tech roadmaps, multi-metric curves,
comparisons and pipelines. **Home shows a sample of each; dedicated pages carry the full detail and
options** (e.g. `/compare`). Everything follows TDAIM
([0002](./0002-tdaim-frontend-foundation.md)) and the v2 domain model
([0004](./0004-domain-model-v2.md)).

Note on **curves**: per the [research](../research/react-native-vs-kmp.md) Turn 7 they are **not only
learning curves** — the conversation frames the _complexity curve_ / _UI-development curve_ ("easy for
the first 20% … increasingly restrictive for the remaining 80%"), i.e. **several metrics per tech,
each with a written finding** (`Metric`, see [0004](./0004-domain-model-v2.md)).

### Mapping to the research's five sections

The research proposes `01 Roadmaps · 02 Technology Comparisons · 03 Knowledge Base · 04 Architecture
Decisions · 05 Dashboard`. Our IA deliberately extends that set:

| Research (§2 → `01`–`05`)   | Our route                                 | Note                                                       |
| --------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| 01 — Roadmaps               | `/roadmaps`, `/roadmaps/:id`              | unchanged                                                  |
| 02 — Technology Comparisons | `/compare`                                | criteria as data ([0004](./0004-domain-model-v2.md))       |
| 03 — Knowledge Base         | `/knowledge`                              | reserved → "coming soon"                                   |
| 04 — Architecture Decisions | `/decisions`                              | reserved → "coming soon"                                   |
| 05 — Dashboard              | `/` (Home)                                | research: _"an overview, not a decorative landing page"_   |
| — (additions)               | `/map`, `/about`, `/curves`, `/pipelines` | hub branching, TDAIM story, multi-metric curves, pipelines |
| — (infrastructure)          | `/login`, `/search`, `*`                  | auth gate, global search, 404                              |

## Decision

**Home page (`/`) content sections, in order:**

1. **Hero** — simpler and welcoming; shows the _current tech_ and _current project_ (from `Focus`).
2. **About / TDAIM philosophy** — what the site is and the model behind it.
3. **Continue where you left off** — last visited roadmap/step (`Focus.lastVisited`).
4. **Hub map preview** — a small, **static/non-interactive** taste of the branching map.
5. **Roadmap catalog** — the set of roadmaps (hubs + per-tech).
6. **Curves** — multi-metric curves with findings.
7. **Comparisons** — side-by-side tech comparisons.
8. **Pipelines teaser** — project pipelines.

Nav + footer are **global chrome**, not content sections — see
[`home`](../pages/home.md#global-chrome).

**Pages and priorities** (nav/footer order is derived from this table, decided **last**):

| Route                         | Purpose                                            | Priority |
| ----------------------------- | -------------------------------------------------- | -------- |
| `/`                           | Home — the sectioned overview above                | P0       |
| `/roadmaps` · `/roadmaps/:id` | Roadmap catalog · a single roadmap (steps)         | P0       |
| `/login`                      | Owner sign-in (guards private reads and writes)    | P0       |
| `*`                           | 404 / not-found                                    | P0       |
| `/map`                        | Full interactive hub map (React Flow)              | P1       |
| `/about`                      | About / TDAIM philosophy                           | P1       |
| `/compare`                    | Side-by-side comparisons                           | P1       |
| `/curves`                     | Multi-metric curves + written findings             | P1       |
| `/pipelines`                  | Project pipelines                                  | P1       |
| `/knowledge`                  | Knowledge Base — reserved, **coming soon**         | P2       |
| `/decisions`                  | Architecture Decisions — reserved, **coming soon** | P2       |
| `/search`                     | Global search — reserved, **coming soon**          | P2       |

**Map is P1:** the interactive React Flow graph is heavy for a first release and research's MVP is
"Foundation + roadmaps"; Home ships a static SVG hub preview on P0 instead.

The nav and the footer **both** expose the top-level destinations; the footer additionally holds the
secondary links (language/theme controls, source, etc.).

**Nav and footer are decided last** — after every page has a spec — and are ordered by the priority
above (see [`docs/pages/`](../pages/README.md)).

## Consequences

- Each home section becomes a **self-contained component** that links to its full page — modular and
  TDAIM-friendly; adding a section or page is additive.
- Every page must meet the mandate targets (Lighthouse 100, AA contrast across dark/light, En/Ar RTL).
- **Resolved:** route is `/compare`; nav **and** footer both list the top-level destinations; the
  hero's _current tech_ / _current project_ are **derived dynamically** from `Focus`
  ([0004](./0004-domain-model-v2.md)); _continue where you left off_ is stored **per owner** (DB, not
  localStorage); reserved routes (`/knowledge`, `/decisions`, `/search`) are shown as **"coming soon"**.
- Each page and each section carries a **priority (P0 MVP / P1 Core / P2 Reserved)**; nav/footer order
  is derived from these once all specs exist (see [`docs/pages/`](../pages/README.md)).
- **Open question:** whether the hero's `Focus` is visible to visitors (portfolio view) or owner-only —
  governed by `Focus.visibility` (see [`home`](../pages/home.md)).
