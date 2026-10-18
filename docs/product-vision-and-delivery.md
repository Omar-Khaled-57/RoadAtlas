# RoadAtlas — Product Vision and Delivery Plan

**Status:** Working product brief · **Source:** [founding conversation](./research/react-native-vs-kmp.md)
([shared conversation](https://chatgpt.com/share/6ad078b0-f308-83ea-9654-c84e63fe42c1))

## Product vision

RoadAtlas is a deployed, personal-first engineering roadmap and decision hub that can grow into a
multi-user product. It helps its owner organize learning, compare technologies, record technical
knowledge and decisions, and return to work in progress. It is both a useful tool and a portfolio
project whose architecture and trade-offs can be explained.

The product should help answer two connected questions:

1. **What should I learn or build next?** Roadmaps, progress, focus, and project pipelines make the
   next step visible.
2. **Why did I choose this approach, and what did I learn?** Comparisons, evidence, notes, findings,
   and decision records preserve the reasoning and the friction discovered over time.

RoadAtlas is more than a CRUD demonstration. Its value comes from connected information, useful
visualizations, deliberate ownership and access rules, and an interface that stays adaptable as the
content and application grow.

## Product principles: TDAIM

TDAIM is the owner's name for this project's development model, not a claim that it is an established
industry standard. Expand it as **Theme- and Direction-Aware Incremental Model**. Modularity is the
way the model is practiced: build cohesive modules in small increments and keep changes local.

- **Theme-aware from the foundation:** at least light and dark themes; components use semantic design
  tokens so a theme change does not require feature rewrites.
- **Direction-aware from the foundation:** English/LTR and Arabic/RTL are first-class. Use logical
  layout properties (`inline-start`, `inline-end`, `text-start`, and their framework equivalents)
  instead of assuming left-to-right layout.
- **Modular:** keep feature responsibilities cohesive and separate. Prefer a modular monolith until
  actual requirements justify another deployment boundary.
- **Incremental:** deliver a working vertical slice, learn from it, then extend it without replacing
  the foundation.
- **Choose tools to support the architecture:** the framework is not the product model. Compare
  approaches by the variation, complexity, and maintenance they permit as a real feature deepens.

Each feature should be designed for theme, language, direction, responsive layout, and accessibility
as part of its first usable increment—not postponed as a polish pass.

## Product areas

| Area                   | User value                                                                            | Current surface              |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| Roadmaps               | Organize learning paths, milestones, prerequisites, progress, and branches            | `/roadmaps`, `/roadmaps/:id` |
| Technology comparisons | Evaluate candidates using changeable criteria, evidence, trade-offs, and a conclusion | `/compare`                   |
| Knowledge base         | Keep notes and references connected to technologies, roadmap topics, and decisions    | `/knowledge` (reserved)      |
| Architecture decisions | Preserve context, alternatives, outcomes, and revisit dates                           | `/decisions` (reserved)      |
| Dashboard and focus    | Show current work, useful next steps, recent activity, and progress                   | `/`                          |
| Curves and findings    | Record how learning, complexity, UI work, productivity, or other metrics change       | `/curves`                    |
| Project pipelines      | Track a concrete project through idea, design, build, ship, and done                  | `/pipelines`                 |
| Roadmap map            | Explore relationships between a hub and its child roadmaps                            | `/map`                       |

The first five areas come from the founding concept. Curves, pipelines, and the map are focused
product surfaces that support the same learning and decision workflow; their delivery order is
defined in [Information Architecture](./decisions/0003-information-architecture.md).

### Record complexity, not just the first impression

Technology comparisons should preserve hidden friction that becomes visible only after substantial
use. A technology can feel simple at the start and become costly as UI customization, data updates,
platform integration, dependency management, or maintenance needs deepen. RoadAtlas should capture
these observations as contextual findings with evidence and dates, not present them as universal
framework rankings. Curves can make changes over time visible when useful data exists.

The original React Native, Kotlin Multiplatform, and Flutter discussion is research context and
example comparison material. RoadAtlas itself is a web application; mobile-specific advice from that
discussion is not a requirement to build a mobile client.

## Audience, hosting, and access

- **Now:** one owner uses the app as a personal tool and presents selected material as a portfolio.
- **Hosting:** deploy online; treat it as a real service, with production configuration, secure
  authentication, validation, and server-side authorization.
- **Later:** allow more users without redesigning ownership. Every private resource has an owner from
  the beginning; the server derives that owner from the authenticated session.
- **Privacy:** resources are private by default. Publishing a roadmap, comparison, note, metric, or
  decision is an explicit visibility choice. Public portfolio content can be read without making
  personal progress or all account data public.
- **Scope:** start as a modular monolith. Defer real-time collaboration, shared workspaces, and
  elaborate analytics until a concrete need appears.

The detailed rules are in [project scope](./decisions/0001-project-scope.md) and the
[domain model](./decisions/0004-domain-model-v2.md).

## Architecture direction

Use the MERN foundation selected for this project: React + TypeScript + Vite for the client,
Node.js + Express + TypeScript for the API, and MongoDB + Mongoose for persistence. Organize the
code as a modular monorepo and add supporting libraries when a real feature needs them. Keep
validation at the API boundary, separate HTTP handling from business rules and persistence when that
separation adds value, and centralize authentication and authorization.

The architecture should support:

- ownership-aware records and explicit public/private visibility;
- localized human-readable content with English fallback when Arabic text is absent;
- criteria and roadmap structures that can evolve as data rather than hardcoded one-off screens;
- caching and request lifecycle handling in the client, so UI state and data access remain distinct;
- performance measurement on representative production builds instead of assumptions based on a
  framework label.

This is an initial direction, not a mandate to create a layer or dependency for every concept. Keep
the implementation as simple as possible while preserving the documented boundaries.

## Delivery increments

Build complete, demonstrable slices in this order. A later increment should extend the previous one
without requiring its replacement.

### 0. Foundation

Monorepo, TypeScript, shared contracts where useful, theme and locale providers, semantic tokens,
RTL/LTR layout rules, accessible shared UI, API error handling, authentication, validation, and
production/development configuration.

**Exit:** a deployed shell can switch light/dark and English/Arabic (including RTL) without a reload
or loss of in-progress form state; protected API operations reject unauthenticated requests.

### 1. Roadmap vertical slice (MVP)

Create, view, update, and delete a roadmap; show ordered steps and progress; persist data; support
loading, empty, and error states; enforce ownership. Include an initial useful dashboard and roadmap
catalog. This is the first end-to-end proof of the stack.

**Exit:** the owner can use the deployed app to track a real roadmap, and another account cannot
read or change private records.

### 2. Roadmap depth and portfolio presentation

Add branches, prerequisites as requirements are settled, filters, resume/last-visited behavior,
publicly selected portfolio content, and the interactive map when justified by the page priority.

### 3. Comparisons and decisions

Add flexible criteria, optional weights, per-score notes, evidence, trade-offs, findings, a
conclusion, and decision records. Start with real framework comparisons from the founding research.

**Exit:** a comparison can be extended with a new criterion without changing a fixed schema or
rewriting its presentation, and its conclusion links back to its evidence and context.

### 4. Connected knowledge and analysis

Add notes, tags, references, cross-links, search, multi-metric curves, and project pipelines as
their specs are prioritized. Keep relationships navigable in both directions where useful.

### 5. Production hardening and growth

Refine accessibility, responsive behavior, backup/restore, security, observability, and performance
based on real usage. Consider multi-user workspaces, collaboration, or additional clients only when
the product has evidence for them.

## Quality bar for every increment

- Works in light and dark, English/LTR and Arabic/RTL; uses semantic theme tokens and logical
  properties.
- Has a responsive layout, keyboard access, visible focus, meaningful headings, and AA contrast.
- Covers applicable loading, empty, error, and unauthorized states.
- Enforces authorization on the server for the specific resource, not only in the UI.
- Adds only the module, data model, dependency, and abstractions needed for the increment.
- Documents consequential architecture choices and measures performance when a performance claim
  matters.

Project-specific implementation rules remain in [AGENTS.md](../AGENTS.md), the
[TDAIM decision](./decisions/0002-tdaim-frontend-foundation.md), and the page specifications.

## How to use this brief

This document records the product intent and sequence. ADRs record binding architectural choices;
page specs define page behavior; the research file preserves the conversation and its source
material. When those documents disagree, resolve the conflict explicitly rather than quietly
implementing whichever version was read last.
