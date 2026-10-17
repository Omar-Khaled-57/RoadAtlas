# Knowledge Base — `/knowledge`

**Priority:** P2 · **Status:** Coming soon · **Reserved:** yes

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

Reserved route that renders a **"coming soon"** state. Still appears in nav/footer (ordered by
priority) and on the home page only if we decide to surface a teaser.
