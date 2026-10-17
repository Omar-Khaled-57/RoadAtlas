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

## Page specs

Per-page specifications (each split into section specs), with priorities. Start at the
[index](./pages/README.md).

## Research / inspiration

- [React Native vs KMP](./research/react-native-vs-kmp.md) — the source conversation that seeded
  RoadAtlas: RN vs KMP vs Flutter comparisons, use cases, "hidden friction", and the
  **learning curve vs complexity curve** framing. Reused as comparison content and as reasoning
  behind decision 0002 (TDAIM).

## How to add a decision

Copy the format of an existing file in `decisions/`, increment the number, and link it in the
table above. Keep each one short: context, decision, consequences.
