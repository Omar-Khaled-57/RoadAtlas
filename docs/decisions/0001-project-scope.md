# 0001 — Project scope, stack and data model

**Status:** Accepted · **Date:** 2026-10-15

## Context

Personal tool + portfolio to **showcase, follow, track and revisit** tech roadmaps: branching hub
roadmaps (e.g. Mobile Dev → Flutter / KMP / React Native → per-tech roadmap), tech **comparison**
tables, multi-metric **curves with written findings**, and project **pipelines**.

## Decision

- **Monorepo** (npm workspaces): `client/` (Vite + React), `server/` (Express), `shared/` (types).
- **TypeScript** everywhere.
- **MongoDB Atlas** (free tier) — no local Mongo (tight disk).
- **Frontend:** React Router, Tailwind, **Framer Motion**, **React Flow** (`@xyflow/react`),
  **Recharts**, TanStack Query.
- **Backend:** Express, Mongoose, zod, JWT in httpOnly cookie, bcrypt.
- **Admin:** single admin (env credentials); public read, protected writes.
- **Progress:** stored in DB, tied to the admin login.
- **Local-first now**, structured so it can deploy later.

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
