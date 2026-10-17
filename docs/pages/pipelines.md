# Pipelines — `/pipelines`

**Priority:** P1 · **Status:** Spec

## Purpose

Track **project pipelines**: a roadmap with `kind: pipeline` — the stages of a concrete project from
idea to done.

## Data needs

`Roadmap(ownerId, visibility, kind: pipeline, title: LocalizedString)` ·
`Step(order, stage: idea|design|build|ship|done)` · `Progress` · `Note` — see
[0004](../decisions/0004-domain-model-v2.md). A stage is a `Step.stage` grouping, not a separate
entity.

## Sections

### 1. Header

- **Purpose:** context + primary action.
- **Content:** title; admin-only **New pipeline**.
- **Priority:** P1.

### 2. Pipeline list

- **Purpose:** see all pipelines at a glance.
- **Content:** card/row per pipeline — name, current stage, progress, last updated; link to detail.
- **States:** default · loading · empty (CTA: create first pipeline) · error.
- **Priority:** P1.

### 3. Pipeline detail / stage flow

- **Purpose:** show a pipeline's stages as a flow.
- **Content:** horizontal stage stepper (idea → design → build → ship → done); current stage marked.
- **Interactions:** click a stage → its steps; admin advances the stage.
- **Priority:** P1.

### 4. Steps & notes

- **Purpose:** the detail beneath each stage.
- **Content:** steps + status + notes; checkable by the admin.
- **Priority:** P1.

## TDAIM notes

- The stepper flows start→end; under RTL it mirrors, but any time/order semantics stay logical.

## Notes

- Pipelines reuse the exact `Roadmap`/`Step` shapes (`kind: 'pipeline'`, steps grouped by `stage`) —
  resolved in [0004](../decisions/0004-domain-model-v2.md).
