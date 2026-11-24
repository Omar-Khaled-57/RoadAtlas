# Knowledge Base — `/knowledge`

**Priority:** P2 (original) · **Status:** Implemented (originally reserved)

## Purpose

Technical notes, snippets, references and lessons learned — with **search, tags and cross-links**, and
relationships between notes and roadmap topics / technologies / decisions (research §2 → **03 — Knowledge
Base**; seeded by research Increment 4). The point
is _connected knowledge rather than isolated CRUD records_.

## Data needs (when built)

`Note(ownerId, visibility, targetType, targetId, title: LocalizedString, content: LocalizedString,
tags[], references[])` — see [0004](../decisions/0004-domain-model-v2.md).

## Scope (when built)

- Markdown notes + code blocks.
- Tags, search, filters.
- Cross-links between notes and roadmap topics / tech / decisions.
- Backs the `Note` entity (`targetType`/`targetId`).

## Now

The original reserved design was a **"coming soon"** state in nav/footer. The
current route is implemented by
[`KnowledgePage.tsx`](../../client/src/pages/KnowledgePage.tsx) with note
filtering, local query matching, Markdown rendering and owner create/edit/delete
forms when authenticated. Public notes are listed for visitors;
[`KnowledgeDetailPage.tsx`](../../client/src/pages/KnowledgeDetailPage.tsx)
handles `/knowledge/:id`. The route appears in the nav; see
[`AppShell.tsx`](../../client/src/components/AppShell.tsx).
