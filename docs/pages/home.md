# Home — `/`

**Priority:** P0 · **Status:** Spec

## Purpose

The welcoming entry point. It orients a first-time visitor and gives the owner a fast path back to
where they left off. Home is a **teaser hub** — every section previews a fuller page and links to it.

## Global chrome

Nav + footer are not page sections; see [index](./README.md#navigation-and-footer). Both list the top-level
destinations, ordered by priority.

## Data needs

`Focus` (current tech/project + last visited, per owner) · `Progress` · `Roadmap` (hub + tech) ·
`Metric` · `Comparison` · `Tech`. Theme/direction come from the TDAIM foundation. See
[0004](../decisions/0004-domain-model-v2.md).

## Sections

### 1. Hero

- **Purpose:** welcome, and instantly show _what I'm on now_.
- **Content:** product name + one-line value prop; owner-managed focus cards for **Current tech**,
  **Current project**, and **Next milestone**, linked to their roadmap or step records; primary CTAs (**Explore the map** →
  `/map`, **Browse roadmaps** → `/roadmaps`).
- **Interactions:** CTAs navigate; focus cards link to their entity.
- **States:** default · skeleton while focus data loads · fallback when there is no active tech/project.
- **Priority:** P0.

### 2. About / TDAIM teaser

- **Purpose:** say what RoadAtlas is and which model it follows, in two or three lines.
- **Content:** a short blurb + link to `/about`.
- **States:** static.
- **Priority:** P1.

### 3. Continue where you left off

- **Purpose:** one-click resume for the owner.
- **Content:** last visited roadmap + next incomplete step, with progress. **Per owner** (`Focus.lastVisited` +
  `Progress` in the DB).
- **Interactions:** resumes the roadmap/step; a dismiss control.
- **States:** default · hidden from visitors or when there is no owner progress.
- **Priority:** P0.

### 4. Hub map preview

- **Purpose:** a taste of the branching map.
- **Content:** small SVG preview generated from saved public roadmaps and `parentId` edges — P0
  representation of the P1 interactive [map](./map.md).
- **Interactions:** roadmap nodes open their detail pages; the preview links to `/map`.
- **States:** default · skeleton · empty (no roadmaps yet).
- **Priority:** P0.

### 5. Roadmap catalog preview

- **Purpose:** surface what exists.
- **Content:** up to ten saved roadmap cards (hubs + tech) with owner-only progress; link to `/roadmaps`.
- **States:** default · skeleton · empty.
- **Priority:** P0.

### 6. Curves preview

- **Purpose:** show that curves are **multi-metric**, not just learning curves.
- **Content:** a small multi-metric chart with one written **finding**; link to `/curves`.
- **States:** default · skeleton · empty.
- **Priority:** P1.

### 7. Comparisons preview

- **Purpose:** show side-by-side evaluation.
- **Content:** a compact comparison teaser (techs × criteria); link to `/compare`.
- **States:** default · skeleton · empty.
- **Priority:** P1.

### 8. Pipelines teaser

- **Purpose:** point at the project pipelines.
- **Content:** one pipeline's stage flow, condensed; link to `/pipelines`.
- **States:** default · skeleton · empty.
- **Priority:** P1.

## Notes

- Focus cards read from `Focus` ([0004](../decisions/0004-domain-model-v2.md)). Visitors see them
  only when the focus record is explicitly public; otherwise show a curated/static portfolio fallback.
- Continue uses `Focus.lastVisited` and is always private to its owner.
- Owner focus rows reference a tech roadmap, pipeline roadmap, or pipeline step. The owner can add,
  remove, reorder, and highlight up to two rows. Their titles, links, and progress are derived from
  the referenced records; anonymous visitors never receive this private focus data.
