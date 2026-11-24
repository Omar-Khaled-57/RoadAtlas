# Product

## What RoadAtlas is

RoadAtlas is a personal-first engineering roadmap and decision hub that also
serves as a portfolio. It helps the owner showcase, follow, track, and revisit
technology roadmaps, compare candidates with evidence, record knowledge and
decisions, plot multi-metric curves, and move projects through pipelines. The
product intent and delivery sequence are recorded in
[product-vision-and-delivery.md](./product-vision-and-delivery.md).

The current implementation is a Vite/React SPA with an Express API backed by
PostgreSQL. Earlier plans and the founding research describe a MongoDB/Mongoose
stack; [architecture.md](./architecture.md) records the implementation that is
actually in the repository.

## Who it is for

- **Visitors** browse public roadmaps, comparisons, curves, notes, decisions,
  and the interactive map without an account.
- **The owner** signs in at `/login` (the link is hidden from normal navigation;
  typing `OMR` opens the login dialog) to create and edit content, set
  visibility, track progress, and manage focus. See
  [`AppShell.tsx`](../client/src/components/AppShell.tsx) and
  [`middleware/auth.ts`](../server/src/middleware/auth.ts).

## What it does today

| Area            | Capability                                                                                                          | Evidence                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home and focus  | Current focus rows, weekly focus, resume/last-visited, roadmap and content previews                                 | [`src/App.tsx`](../client/src/App.tsx), [`components/OwnerFocusPanel.tsx`](../client/src/components/OwnerFocusPanel.tsx), [`components/WeeklyFocusBoard.tsx`](../client/src/components/WeeklyFocusBoard.tsx)                                                       |
| Roadmaps        | Catalog, detail pages, branching via `parentId`, ordered steps, progress, hub map                                   | [`pages/RoadmapsPage.tsx`](../client/src/pages/RoadmapsPage.tsx), [`pages/RoadmapDetailPage.tsx`](../client/src/pages/RoadmapDetailPage.tsx), [`pages/MapPage.tsx`](../client/src/pages/MapPage.tsx), [`data/roadmapGraph.ts`](../client/src/data/roadmapGraph.ts) |
| Comparisons     | Weighted criteria-as-data, candidate scores, evidence, conclusion, revisit date                                     | [`pages/ComparePage.tsx`](../client/src/pages/ComparePage.tsx), [`data/comparisons.ts`](../client/src/data/comparisons.ts), [`routes/comparisons.ts`](../server/src/routes/comparisons.ts)                                                                         |
| Curves          | Typed metric points with written findings                                                                           | [`pages/CurvesPage.tsx`](../client/src/pages/CurvesPage.tsx), [`routes/metrics.ts`](../server/src/routes/metrics.ts)                                                                                                                                               |
| Pipelines       | Roadmaps of kind `pipeline` with `idea → design → build → ship → done` stages                                       | [`pages/PipelinesPage.tsx`](../client/src/pages/PipelinesPage.tsx), [`routes/roadmaps.ts`](../server/src/routes/roadmaps.ts)                                                                                                                                       |
| Knowledge       | Notes connected to roadmaps, steps, tech, and decisions, with Markdown content                                      | [`pages/KnowledgePage.tsx`](../client/src/pages/KnowledgePage.tsx), [`components/MarkdownContent.tsx`](../client/src/components/MarkdownContent.tsx), [`routes/notes.ts`](../server/src/routes/notes.ts)                                                           |
| Decisions       | Decision records with context, alternatives, outcome, consequences, and revisit date                                | [`pages/DecisionsPage.tsx`](../client/src/pages/DecisionsPage.tsx), [`routes/decisions.ts`](../server/src/routes/decisions.ts)                                                                                                                                     |
| Search          | Case/diacritic-insensitive search across roadmaps, steps, tech, comparisons, curves, notes, and decisions           | [`pages/SearchPage.tsx`](../client/src/pages/SearchPage.tsx)                                                                                                                                                                                                       |
| TDAIM UI        | `dark`, `light`, and `ocean` themes; English/Arabic with RTL; semantic CSS tokens                                   | [`theme/theme-context.ts`](../client/src/theme/theme-context.ts), [`theme/ThemeProvider.tsx`](../client/src/theme/ThemeProvider.tsx), [`i18n/index.ts`](../client/src/i18n/index.ts), [`src/index.css`](../client/src/index.css)                                   |
| Auth and access | Single-owner JWT session in an httpOnly cookie, bcrypt password, server-derived owner id, public/private visibility | [`middleware/auth.ts`](../server/src/middleware/auth.ts), [`routes/auth.ts`](../server/src/routes/auth.ts), [`shared/src/index.ts`](../shared/src/index.ts)                                                                                                        |

Routes are declared in [`client/src/App.tsx`](../client/src/App.tsx): `/`,
`/map`, `/roadmaps`, `/roadmaps/:id`, `/compare`, `/compare/:id`, `/curves`,
`/pipelines`, `/pipelines/:id`, `/knowledge`, `/knowledge/:id`, `/decisions`,
`/decisions/:id`, `/search`, `/about`, `/login`, and a `*` 404. Page-level
specifications live in [`docs/pages/`](./pages/README.md).

## Non-goals and known gaps

- One owner account is in scope; there is no sign-up, role hierarchy, or
  multi-user workspace. Ownership fields exist to keep future users possible.
- The product brief defers real-time collaboration, shared workspaces, and
  elaborate analytics. See
  [product-vision-and-delivery.md](./product-vision-and-delivery.md#audience-hosting-and-access).
- The fixed technology catalogue in
  [`client/src/data/techCatalogue.ts`](../client/src/data/techCatalogue.ts) is
  display metadata only; comparisons, metrics, notes, and decisions come from
  the server.
- The old page specs still label `/knowledge`, `/decisions`, and `/search` as
  "coming soon"; those routes now have implemented pages. The current status is
  noted in [`pages/README.md`](./pages/README.md).
- The server test suite requires a running PostgreSQL database; see
  [testing.md](./testing.md#verification-run).

## Sources

- [`README.md`](../README.md)
- [`client/src/App.tsx`](../client/src/App.tsx), [`client/src/data/`](../client/src/data/api.ts)
- [`server/src/app.ts`](../server/src/app.ts), [`server/src/routes/`](../server/src/routes/auth.ts)
- [`shared/src/index.ts`](../shared/src/index.ts)
- [`docs/product-vision-and-delivery.md`](./product-vision-and-delivery.md)
