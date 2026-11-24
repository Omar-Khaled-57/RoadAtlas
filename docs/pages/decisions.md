# Architecture Decisions — `/decisions`

**Priority:** P2 (original) · **Status:** Implemented (originally reserved)

## Purpose

Record the **reasoning** behind technical choices, not just the outcome (research §2 → **04 — Architecture
Decisions**) — an in-app
ADR log, productizing `docs/decisions/` itself.

## Data needs (when built)

`DecisionRecord(ownerId, visibility, context, alternatives[], decision, consequences, revisitAt,
links[])` — see [0004](../decisions/0004-domain-model-v2.md).

## Scope (when built)

- Context and constraints.
- Options considered.
- Decision and trade-offs.
- Revisit date and what was learned.
- Links to the tech/roadmap/comparison that motivated it.

## Now

The original reserved design was a **"coming soon"** state in nav/footer. The
current route is implemented by
[`DecisionsPage.tsx`](../../client/src/pages/DecisionsPage.tsx) with public
record lists, localized context/alternatives/decision/consequences, revisit
dates, links and owner create/edit/delete forms when authenticated.
[`DecisionsDetailPage.tsx`](../../client/src/pages/DecisionsDetailPage.tsx)
handles `/decisions/:id`; the route appears in the nav.
