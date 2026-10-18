# 0001 — Project scope, stack and data model

**Status:** Accepted · **Date:** 2026-10-15

## Context

Personal-first, online tool + portfolio to **showcase, follow, track and revisit** engineering
roadmaps, technology comparisons, connected knowledge, architecture decisions, multi-metric curves,
and project pipelines. It should preserve not only progress and conclusions, but also the evidence
and hidden friction discovered as a technology or project becomes more complex. See the
[product vision](../product-vision-and-delivery.md) and its [founding research](../research/react-native-vs-kmp.md).

## Decision

- **Monorepo** (npm workspaces): `client/` (Vite + React), `server/` (Express), `shared/` (types).
- **TypeScript** everywhere.
- **MongoDB Atlas** (free tier) — no local Mongo (tight disk).
- **Frontend:** React Router, Tailwind, **React Flow** (`@xyflow/react`),
  TanStack Query.
- **Backend:** Express, Mongoose, zod, JWT in httpOnly cookie, bcrypt.
- **Access:** one owner in the first release; deployed online with secure authentication and
  server-side authorization. Resources are private by default; selected resources can be published
  for the portfolio.
- **Progress:** stored in the database and scoped to its owner.
- **Multi-user ready:** ownership is part of the data model from the start, while collaboration and
  shared workspaces remain later scope.
- **Deployment:** design for a production deployment from the first useful slice, not as a local-only
  prototype.

### Data model

**Superseded by [0004](./0004-domain-model-v2.md)** (ownership, localized content, focus,
comparison criteria, branching, pipeline stages, typed curves). The original v1 sketch was:

`Tech` · `Roadmap(kind: hub|tech|pipeline, parentId)` · `Step(order)` ·
`Metric(techId, points[], finding)` · `Comparison(metricId, techIds[])` ·
`Progress(stepId, done, completedAt)` · `Note(ownerType, ownerId)`.

Branching = a `hub` roadmap whose children are `tech` roadmaps linked by `parentId`.

## Consequences

- Mongo's document model lets the data model evolve cheaply (e.g. comparing **learning curve vs
  complexity curve** — see the [research](../research/react-native-vs-kmp.md)).
- Needs a free Atlas account for `MONGODB_URI`.
- Full visual CMS (Phase later) will own create/edit/reorder and a curve-point editor.
