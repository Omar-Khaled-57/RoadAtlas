# Search — `/search`

**Priority:** P2 (original) · **Status:** Implemented (originally reserved)

## Purpose

Global search across roadmaps, steps, technologies, comparisons, curves and notes — the thing that
turns a collection into **connected knowledge** rather than isolated records (research §3 → _Knowledge
base + search_, Increment 4). Ships alongside the knowledge base.

## Scope (when built)

- Full-text search over localized content (`LocalizedString` — [0004](../decisions/0004-domain-model-v2.md)).
- Filter by entity type; results link into `/roadmaps/:id`, `/compare`, `/curves`, `/knowledge`.
- Keyboard shortcut (Cmd/Ctrl+K) as a command palette later.
- Search indexes follow real query patterns (research §3).

## Now

The original reserved design was a **"coming soon"** state in nav/footer. The
current route is implemented by
[`SearchPage.tsx`](../../client/src/pages/SearchPage.tsx): case/diacritic-insensitive
client-side matching with type filters across roadmaps, steps, technologies,
comparisons, curves, notes and decisions. It appears in the nav; `Cmd/Ctrl+K`
navigates to `/search` through
[`AppShell.tsx`](../../client/src/components/AppShell.tsx).
