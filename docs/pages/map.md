# Map — `/map`

**Priority:** P1 · **Status:** Spec

## Purpose

The interactive **hub map**: the branching picture of how roadmaps relate — a hub roadmap whose steps
are tech roadmaps (e.g. Mobile Dev → Flutter / KMP / React Native). Rendered with **React Flow**
(`@xyflow/react`).

## Data needs

`Roadmap(ownerId, visibility, kind, parentId)` (parent → child edges) · `Progress` (node
status/highlight) — see [0004](../decisions/0004-domain-model-v2.md).

## Sections

### 1. Header

- **Purpose:** context + controls entry.
- **Content:** title, subtitle, legend toggle.
- **Priority:** P1.

### 2. Graph canvas

- **Purpose:** the map itself.
- **Content:** nodes = roadmaps (hub/tech/pipeline styled differently); edges = parent → child.
  Node shows title + status.
- **Interactions:** pan · zoom · fit-to-view · click node → detail; keyboard-focusable nodes.
- **States:** default · loading · empty (no roadmaps — CTA to create) · error.
- **Priority:** P1.

### 3. Legend / filters

- **Purpose:** make the map legible and filterable.
- **Content:** node-kind legend; filters by kind/status.
- **Priority:** P1.

### 4. Node detail panel

- **Purpose:** act on a node without leaving the map.
- **Content:** side drawer — roadmap summary, progress, link to `/roadmaps/:id`.
- **States:** closed (default) · open · loading.
- **Priority:** P1.

## TDAIM notes

- Graph chrome (controls, minimap, background) themed via React Flow's themable pieces + tokens.
- Direction: keep graph coordinates direction-neutral; localize labels; the drawer mirrors under RTL.

## Notes

- **Priority is P1:** the interactive React Flow graph is heavy for a first release, and research's MVP
  is "Foundation + roadmaps". Home ships a **static SVG hub preview** on P0, so the branching idea is
  present from day one without the interactive graph. React Flow then lands with this page.
