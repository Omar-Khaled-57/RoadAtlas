# 0004 — Domain model v2

**Status:** Proposed · **Date:** 2026-10-15

## Context

[0001](./0001-project-scope.md) sketched a first domain model while scoping the project. A full page
spec pass ([pages/](../pages/README.md)) surfaced concrete requirements the v1 model cannot satisfy,
and the [research](../research/react-native-vs-kmp.md) §3 ("Design the data for future multi-user
support") adds constraints we should honor from day one. This ADR revises the model; 0001's list
stands only as history.

## Problems with v1

1. **No `ownerId`.** Every resource is personal, and the research is explicit: _"every personal
   resource should have an owner from the beginning"_ (research §3). Missing this makes a
   later multi-user migration painful.
2. **No localized content.** TDAIM requires English **and** Arabic, but `title`/`description`/`finding`
   are single strings.
3. **No place for "current focus".** Home's hero (_current tech_ / _current project_) and _continue
   where you left off_ cannot be derived from `Progress(stepId, done, completedAt)`.
4. **Comparison holds one metric.** `Comparison(metricId, techIds[])` can't express the research's
   custom, weighted, multi-criteria table (`ComparisonCriterion`, research §3 lines ~1077 & 1087).
5. **Branching is contradictory.** 0001 says a hub's _steps_ are tech roadmaps, but `Step` has no child
   reference, while the [map](../pages/map.md) expects `Roadmap.parentId` edges.
6. **No pipeline stages.** [pipelines](../pages/pipelines.md) needs stages (idea → … → done) that the
   model lacks.
7. **Untyped curve points.** [curves](../pages/curves.md) needs an axis and `{x, y}` points.

## Decision

**Ownership (all user-owned entities).** Add `ownerId: ObjectId` to `Roadmap`, `Step`, `Comparison`,
`Metric`, `Note`, `DecisionRecord`, `Progress`, `Focus`. **The server derives the owner from the
verified session, never from a client-supplied id** (research §3). Single admin today; no schema
change needed for multi-user later.

**Localized content.** Introduce `LocalizedString = { en: string; ar?: string }` and use it for every
human-readable field: `Roadmap.title/description`, `Step.title`, `Metric.finding`,
`Comparison.title/conclusion`, `Criterion.name`, `Note.title/content`, `DecisionRecord.*`. `ar` falls back
to `en` when absent. Dates/numbers are locale-formatted at render, not stored localized.

**Visibility.** Add `visibility: 'public' | 'private'` (default `public`) to `Roadmap`, `Comparison`,
`Metric`, `Note`, `DecisionRecord`, `Focus`. Public read serves the portfolio; writes stay admin-only.

**Timestamps.** `createdAt` / `updatedAt` on every entity (research §3).

**Branching — via `parentId`.** A hub's children are roadmaps whose `parentId` points at the hub
(this replaces 0001's "a hub whose steps are tech roadmaps"). `Step` remains ordered items **within**
one roadmap only — it never points at another roadmap.

**Pipeline stages — `Step.stage`.** A pipeline is a `Roadmap(kind: 'pipeline')` and each step carries
`stage: 'idea' | 'design' | 'build' | 'ship' | 'done'`. No separate `Stage` collection (research §3:
don't create a collection for every tiny concept).

**Comparisons — criteria as data.**
`Comparison(ownerId, visibility, title, candidateTechIds[], criteria[], conclusion, createdAt, updatedAt)`
where `Criterion = { id, name: LocalizedString, weight: number, scores: Record<techId, { value: number; note?: LocalizedString }> }`.
Metrics may _seed_ criteria but are a separate concern.

**Curves — typed axis + points.**
`Metric(ownerId, visibility, techId, key, axis, points, finding, createdAt, updatedAt)` where
`axis = { key, label: LocalizedString, unit?: string }` and `points: { x: number; y: number }[]`.
Multiple metrics per tech = multiple `Metric` docs (learning curve **and** complexity/UI curve, …).

**Notes.** `Note(ownerId, visibility, targetType, targetId, title: LocalizedString,
content: LocalizedString, tags: string[], references: string[], createdAt, updatedAt)` — polymorphic
attachment to any entity via `targetType`/`targetId` (roadmap/step/tech/decision); `ownerId` is the
owning user (distinct from the target).

**Focus (new).** `Focus(ownerId, visibility, currentTechId?, currentProjectId?, lastVisited?, updatedAt)`
— one per owner. `currentProjectId` is a pipeline `Roadmap`; `lastVisited = { roadmapId, stepId, at }`.
Powers the Home hero and _continue where you left off_.

**DecisionRecord (new).** `DecisionRecord(ownerId, visibility, context, alternatives[], decision,
consequences, revisitAt, links[], createdAt, updatedAt)` — backs the reserved `/decisions` page
(research §2 → 04).

**Relationships.** Store explicit foreign-key ids; indexes follow real query patterns (research §3).

## Consequences

- [0001](./0001-project-scope.md) data-model line is superseded by this ADR.
- Every write API must enforce `ownerId` + `visibility` (owner from session; public read allowed,
  writes admin-only) — see research §3 "Authorization from day one".
- Localized content means API responses are locale-aware (request locale or per-field `{en, ar}`).
- Adding a language later = extend `LocalizedString`; no structural rewrite (TDAIM).
- Slightly more upfront modeling; avoids the expensive retrofits called out above.

## Open questions

- Is `Focus` per-owner singleton, or a small history (recent list)?
- Do we expose a public `Focus` ("now" card) or keep it admin-only with a curated public fallback?
