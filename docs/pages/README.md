# RoadAtlas — Page Specs

Per-page specifications, each broken into **section specs**. Home (`/`) is the
entry point. These specs preserve the original design intent; the table below
also records which routes are implemented in
[`client/src/App.tsx`](../../client/src/App.tsx). Everything follows TDAIM
([0002](../decisions/0002-tdaim-frontend-foundation.md)), the v2 domain model
([0004](../decisions/0004-domain-model-v2.md)) and the quality targets recorded
in the specs (Lighthouse 100; AA contrast in dark/light; En/Ar RTL; smooth
motion; responsive). No Lighthouse report is committed in this repository.

## Priority key

Priorities are the original delivery plan, not the current implementation state.

- **P0 — MVP:** required for the first usable release.
- **P1 — Core:** the main product value; built right after MVP.
- **P2 — Reserved:** originally planned as a **"coming soon"** route; these
  routes are now implemented, as noted below.

## Pages

| Page                   | Route                           | Original priority | Spec status | Current route |
| ---------------------- | ------------------------------- | ----------------- | ----------- | ------------- |
| Home                   | `/`                             | P0                | Spec        | Implemented   |
| Roadmaps               | `/roadmaps` · `/roadmaps/:id`   | P0                | Spec        | Implemented   |
| Login                  | `/login`                        | P0                | Spec        | Implemented   |
| Not found              | `*` (404)                       | P0                | Spec        | Implemented   |
| Map                    | `/map`                          | P1                | Spec        | Implemented   |
| About                  | `/about`                        | P1                | Spec        | Implemented   |
| Compare                | `/compare` · `/compare/:id`     | P1                | Spec        | Implemented   |
| Curves                 | `/curves`                       | P1                | Spec        | Implemented   |
| Pipelines              | `/pipelines` · `/pipelines/:id` | P1                | Spec        | Implemented   |
| Knowledge Base         | `/knowledge` · `/knowledge/:id` | P2                | Spec        | Implemented   |
| Architecture Decisions | `/decisions` · `/decisions/:id` | P2                | Spec        | Implemented   |
| Search                 | `/search`                       | P2                | Spec        | Implemented   |

## Navigation and footer

The current nav in
[`client/src/components/AppShell.tsx`](../../client/src/components/AppShell.tsx)
lists Map, Roadmaps, Compare, Pipelines, Knowledge, Decisions and Search. Login
is hidden from normal navigation and opened from `/login`, the `OMR` sequence or
the footer easter egg. The footer contains copyright/tagline text and the
easter egg; it does not duplicate the nav. The original ADR
([0003](../decisions/0003-information-architecture.md)) proposed nav and footer
destination lists ordered by priority.

Knowledge, Decisions and Search no longer render a "coming soon" state; their
individual specs retain that text as the original reserved-design section.

## Common requirements (every page)

- **TDAIM:** semantic tokens only; logical CSS properties; correct in dark/light; En/Ar (RTL/LTR).
- **States:** default · loading (skeleton) · empty · error · (where relevant) unauthorized.
- **Responsive:** mobile-first; layout mirrors under RTL.
- **Motion:** honor `prefers-reduced-motion`; animate `transform`/`opacity` only.
- **a11y:** keyboard reachable, visible focus, AA contrast, landmarks, ordered headings.
- **SEO:** localized `<title>` + meta description per route.
