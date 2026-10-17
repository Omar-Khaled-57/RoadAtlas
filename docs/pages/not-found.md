# Not found — `*` (404)

**Priority:** P0 · **Status:** Spec

## Purpose

The catch-all route for any unknown path (typos, dead links, deep links to deleted content). Every
route spec assumes a 404 fallback exists.

## Sections

### 1. Not-found panel

- **Purpose:** recover the visitor gracefully.
- **Content:** a friendly message, plus primary CTA **Back to home** → `/` and a secondary link to the
  [roadmaps](./roadmaps.md) catalog. Optionally list the most popular destinations.
- **States:** default · (no data needed — static).
- **Priority:** P0.

### 2. Missing-entity variant

- **Purpose:** distinguish "unknown path" from "known route, id not found" (e.g. `/roadmaps/:id`
  deleted).
- **Content:** the same panel, with entity-specific copy ("This roadmap no longer exists").
- **Priority:** P1.

## TDAIM notes

- Localized copy; tokens for color; logical alignment.
