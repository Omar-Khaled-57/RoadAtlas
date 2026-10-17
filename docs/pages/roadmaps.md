# Roadmaps — `/roadmaps` · `/roadmaps/:id`

**Priority:** P0 · **Status:** Spec

Two routes, one feature: a **catalog** and a single **roadmap detail**.

## Data needs

`Roadmap(ownerId, visibility, kind, parentId, title/description: LocalizedString)` · `Step(order, stage?)` ·
`Progress(stepId, done, completedAt)` · `Note(ownerId, targetType, targetId, tags[], references[])` — see
[0004](../decisions/0004-domain-model-v2.md).

---

## `/roadmaps` — Catalog

### Purpose

List every roadmap (hubs + per-tech) and let the admin filter/browse.

### Sections

#### 1. Header

- **Purpose:** context + primary action.
- **Content:** title, count; admin-only **New roadmap**.
- **Priority:** P0.

#### 2. Filters

- **Purpose:** narrow the list.
- **Content:** by kind (hub/tech/pipeline) and status (planned/in-progress/completed/paused).
- **Priority:** P1.

#### 3. Catalog grid

- **Purpose:** the list.
- **Content:** card per roadmap — title, kind badge, progress, last updated; links to detail.
- **States:** default · loading (skeleton) · **empty** (CTA: create first roadmap / see the map) · error.
- **Priority:** P0.

---

## `/roadmaps/:id` — Detail

### Purpose

The roadmap itself: its steps, notes, progress, and (for hubs) its child branch.

### Sections

#### 1. Header

- **Purpose:** identify + summarize.
- **Content:** title, kind, status, **progress ring**; parent link if it's a branch.
- **Priority:** P0.

#### 2. Overview

- **Purpose:** the "why/what" of this roadmap.
- **Content:** description (localized); prerequisites; related topics.
- **Priority:** P0.

#### 3. Steps

- **Purpose:** the ordered path.
- **Content:** ordered steps with status; checkable by the admin; per-step notes.
- **Interactions:** toggle done (persists to `Progress`); reorder/add/edit (admin).
- **States:** default · loading · empty (no steps yet) · error.
- **Priority:** P0.

#### 4. Branch (hubs only)

- **Purpose:** show the branching.
- **Content:** child roadmaps (`parentId` = this hub) as cards; link into each.
- **Priority:** P1.

#### 5. Related

- **Purpose:** connect the roadmap to the rest of the product.
- **Content:** its **curves** (`Metric`), relevant **comparisons**, related notes.
- **Priority:** P1.

#### 6. Progress controls (admin)

- **Purpose:** own the tracking.
- **Content:** mark steps done/undone, set status, completed timestamps.
- **Priority:** P1.

## Open questions

- Step model: are prerequisites intra-roadmap only, or cross-roadmap dependencies too?
