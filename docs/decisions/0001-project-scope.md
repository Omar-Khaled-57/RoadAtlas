# 0001 — Project scope, stack and data model

**Status:** Accepted (historical stack; persistence superseded) · **Date:** 2026-10-15

**Current implementation note:** the running API uses Express with `pg` and
PostgreSQL via `DATABASE_URL`. The MongoDB Atlas/Mongoose choices below are kept
as the original decision, not as a description of the current runtime. See
[architecture.md](../architecture.md).

## Context

Personal-first, online tool + portfolio to **showcase, follow, track and revisit** engineering
roadmaps, technology comparisons, connected knowledge, architecture decisions, multi-metric curves,
and project pipelines. It should preserve not only progress and conclusions, but also the evidence
and hidden friction discovered as a technology or project becomes more complex. See the
[product vision](../product-vision-and-delivery.md) and its [founding research](../research/react-native-vs-kmp.md).

## Decision

- **Monorepo** (npm workspaces): `client/` (Vite + React), `server/` (Express), `shared/` (types).
- **TypeScript** everywhere.
- **MongoDB Atlas** (free tier) — original persistence decision; the current
  runtime uses PostgreSQL via `DATABASE_URL`.
- **Frontend:** React Router, Tailwind, **React Flow** (`@xyflow/react`),
  TanStack Query.
- **Backend:** originally Express, Mongoose, zod, JWT in httpOnly cookie,
  bcrypt; current code uses Express, `pg`, zod, JWT in an httpOnly cookie and
  bcryptjs.
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

- The original Mongo document model was chosen to let the data model evolve
  cheaply (e.g. comparing **learning curve vs complexity curve** — see the
  [research](../research/react-native-vs-kmp.md)). The current relational schema
  is in [`server/sql/schema.sql`](../../server/sql/schema.sql).
- Originally needed a free Atlas account for `MONGODB_URI`; deployment now uses
  `DATABASE_URL` and PostgreSQL.
- Full visual CMS (Phase later) will own create/edit/reorder and a curve-point editor.
