# RoadAtlas — Docs

Project documentation. Kept **modular and incremental** (per TDAIM): each idea lives in its own
small file and can evolve without rewriting the rest.

## Decisions (ADR-style)

| #                                                     | Decision                                                   | Status   |
| ----------------------------------------------------- | ---------------------------------------------------------- | -------- |
| [0001](./decisions/0001-project-scope.md)             | Project scope, stack and data model                        | Accepted |
| [0002](./decisions/0002-tdaim-frontend-foundation.md) | TDAIM frontend foundation (themes + En/Ar + RTL)           | Accepted |
| [0003](./decisions/0003-information-architecture.md)  | Information architecture & home page                       | Proposed |
| [0004](./decisions/0004-domain-model-v2.md)           | Domain model v2 (ownership, i18n content, focus, criteria) | Proposed |

## Product direction

- [Product vision and delivery plan](./product-vision-and-delivery.md) — the purpose, TDAIM
  principles, privacy and hosting assumptions, module map, incremental delivery sequence, and
  quality bar distilled from the founding conversation.

## Page specs

Per-page specifications (each split into section specs), with priorities. Start at the
[index](./pages/README.md).

## Research / inspiration

- [React Native vs KMP](./research/react-native-vs-kmp.md) — exported founding conversation:
  framework comparisons, hidden friction, the learning-vs-complexity curve, TDAIM, and the original
  RoadAtlas scope. The [shared conversation](https://chatgpt.com/share/6ad078b0-f308-83ea-9654-c84e63fe42c1)
  is the source; the local export is the searchable reference. See the product brief for the current
  distilled direction.

## How to add a decision

Copy the format of an existing file in `decisions/`, increment the number, and link it in the
table above. Keep each one short: context, decision, consequences.
