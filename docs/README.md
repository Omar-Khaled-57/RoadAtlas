# RoadAtlas — Docs

Project documentation, kept **modular and incremental** (per TDAIM): each idea
lives in its own small file and can evolve without rewriting the rest.

**Start here:** [product](./product.md) and [architecture](./architecture.md)
describe what is in this repository today. The [product brief](./product-vision-and-delivery.md),
ADRs, page specs, implementation plan and founding research preserve intent and
history; where they contradict the code, the current-runtime pages take
precedence.

## Project entry points

| Document                           | Use it to…                                          |
| ---------------------------------- | --------------------------------------------------- |
| [Project README](../README.md)     | See the product summary, quick start and scripts    |
| [Agent guide](../AGENTS.md)        | Read implementation rules and verification commands |
| [Documentation index](./README.md) | Find every RoadAtlas document                       |

## Standard guides

| Guide                               | Use it to…                                                             |
| ----------------------------------- | ---------------------------------------------------------------------- |
| [Product](./product.md)             | Understand the audience, feature inventory and known gaps              |
| [Architecture](./architecture.md)   | See the real Vite, Express, PostgreSQL and Vercel shape                |
| [Development](./development.md)     | Install, run, use manifest commands and add a feature                  |
| [Configuration](./configuration.md) | Find every env var, config file, local storage key and legacy variable |
| [Testing](./testing.md)             | Run the exact test/typecheck/lint commands and review gaps             |
| [Deployment](./deployment.md)       | Build artifacts, Vercel config and what is not configured              |
| [Operations](./operations.md)       | Configure production, read logs/health and plan backup/restore         |
| [Changelog](./changelog.md)         | Check whether an authoritative release history exists                  |

## Product direction and design

| Document                                                                          | Use it to…                                                                                |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [Product vision and delivery plan](./product-vision-and-delivery.md)              | Read the purpose, TDAIM principles, privacy assumptions, module map and delivery sequence |
| [Visual identity](./visual-identity.md)                                           | Check palette, typography and theme tokens                                                |
| [Server/admin/map implementation plan](./server-admin-map-implementation-plan.md) | Follow the dated implementation plan and its current-implementation note                  |
| [Founding research](./research/react-native-vs-kmp.md)                            | Read the exported conversation behind the original scope                                  |

## Decisions (ADR-style)

| #                                                     | Decision                                                   | Status                               |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| [0001](./decisions/0001-project-scope.md)             | Project scope, stack and data model                        | Accepted (historical stack)          |
| [0002](./decisions/0002-tdaim-frontend-foundation.md) | TDAIM frontend foundation (themes + En/Ar + RTL)           | Accepted                             |
| [0003](./decisions/0003-information-architecture.md)  | Information architecture & home page                       | Proposed (implementation note added) |
| [0004](./decisions/0004-domain-model-v2.md)           | Domain model v2 (ownership, i18n content, focus, criteria) | Proposed (implementation note added) |

## Page specs

Per-page specifications, each split into section specs. Start at the
[index](./pages/README.md), which records implemented status separately from the
original priority.

| Page      | Spec                              |
| --------- | --------------------------------- |
| Home      | [home](./pages/home.md)           |
| Roadmaps  | [roadmaps](./pages/roadmaps.md)   |
| Login     | [login](./pages/login.md)         |
| Not found | [not-found](./pages/not-found.md) |
| Map       | [map](./pages/map.md)             |
| About     | [about](./pages/about.md)         |
| Compare   | [compare](./pages/compare.md)     |
| Curves    | [curves](./pages/curves.md)       |
| Pipelines | [pipelines](./pages/pipelines.md) |
| Knowledge | [knowledge](./pages/knowledge.md) |
| Decisions | [decisions](./pages/decisions.md) |
| Search    | [search](./pages/search.md)       |

## Research / inspiration

The [founding conversation](./research/react-native-vs-kmp.md) preserves the
framework comparisons, hidden friction, learning-vs-complexity discussion,
TDAIM and original RoadAtlas scope. Its
[shared source](https://chatgpt.com/share/6ad078b0-f308-83ea-9654-c84e63fe42c1)
is external to this repository; the local export is the searchable reference.
The [product brief](./product-vision-and-delivery.md) is the distilled current
direction.

## Canonical sources

| Topic                                | Source of truth                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Scripts, workspaces and Node version | [`package.json`](../package.json)                                                                     |
| Workspace scripts and dependencies   | [`client/package.json`](../client/package.json), [`server/package.json`](../server/package.json)      |
| Server env schema                    | [`server/src/config/env.ts`](../server/src/config/env.ts)                                             |
| Client env declaration               | [`client/src/vite-env.d.ts`](../client/src/vite-env.d.ts)                                             |
| Routes                               | [`client/src/App.tsx`](../client/src/App.tsx)                                                         |
| API middleware and mounting          | [`server/src/app.ts`](../server/src/app.ts)                                                           |
| Database schema                      | [`server/sql/schema.sql`](../server/sql/schema.sql)                                                   |
| Deployment config                    | [`vercel.json`](../vercel.json), [`api/index.mjs`](../api/index.mjs)                                  |
| CI                                   | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)                                             |
| Current behavior                     | [architecture](./architecture.md), [configuration](./configuration.md), [operations](./operations.md) |

## How to add a decision

Copy the format of an existing file in `decisions/`, increment the number, and
link it in the table above. Keep each one short: context, decision,
consequences. Mark historical choices clearly when implementation moves on.

## How to add a page spec

Copy an existing file in `pages/`, add it to
[`docs/pages/README.md`](./pages/README.md), and distinguish the original design
from any current-implementation note.
