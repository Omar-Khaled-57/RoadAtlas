# RoadAtlas — Page Specs

Per-page specifications, each broken into **section specs**. Home (`/`) is the entry point: the
**content** pages (About, Map, Roadmaps, Curves, Compare, Pipelines) are reached from a home teaser,
while infrastructure routes (Login, 404) and reserved pages are reached directly. Everything follows
TDAIM ([0002](../decisions/0002-tdaim-frontend-foundation.md)), the v2 domain model
([0004](../decisions/0004-domain-model-v2.md)) and the quality mandates (Lighthouse 100; AA contrast
in dark/light; En/Ar RTL; smooth motion; responsive).

## Priority key

- **P0 — MVP:** required for the first usable release.
- **P1 — Core:** the main product value; built right after MVP.
- **P2 — Reserved:** route reserved, shipped as **"coming soon"**.

## Pages

| Page                   | Route                         | Priority | Status      | Spec                        |
| ---------------------- | ----------------------------- | -------- | ----------- | --------------------------- |
| Home                   | `/`                           | P0       | Spec        | [home](./home.md)           |
| Roadmaps               | `/roadmaps` · `/roadmaps/:id` | P0       | Spec        | [roadmaps](./roadmaps.md)   |
| Login                  | `/login`                      | P0       | Spec        | [login](./login.md)         |
| Not found              | `*` (404)                     | P0       | Spec        | [not-found](./not-found.md) |
| Map                    | `/map`                        | P1       | Spec        | [map](./map.md)             |
| About                  | `/about`                      | P1       | Spec        | [about](./about.md)         |
| Compare                | `/compare`                    | P1       | Spec        | [compare](./compare.md)     |
| Curves                 | `/curves`                     | P1       | Spec        | [curves](./curves.md)       |
| Pipelines              | `/pipelines`                  | P1       | Spec        | [pipelines](./pipelines.md) |
| Knowledge Base         | `/knowledge`                  | P2       | Coming soon | [knowledge](./knowledge.md) |
| Architecture Decisions | `/decisions`                  | P2       | Coming soon | [decisions](./decisions.md) |
| Search                 | `/search`                     | P2       | Coming soon | [search](./search.md)       |

## Navigation and footer

Decided **after** all page specs exist. Both the nav and the footer list the top-level destinations,
**ordered by priority** (from the table above). Reserved (P2) destinations appear as "coming soon".

## Common requirements (every page)

- **TDAIM:** semantic tokens only; logical CSS properties; correct in dark/light; En/Ar (RTL/LTR).
- **States:** default · loading (skeleton) · empty · error · (where relevant) unauthorized.
- **Responsive:** mobile-first; layout mirrors under RTL.
- **Motion:** honor `prefers-reduced-motion`; animate `transform`/`opacity` only.
- **a11y:** keyboard reachable, visible focus, AA contrast, landmarks, ordered headings.
- **SEO:** localized `<title>` + meta description per route.
