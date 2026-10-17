# Curves — `/curves`

**Priority:** P1 · **Status:** Spec

## Purpose

Track **multiple metrics per technology** — _not only the learning curve_. The research frames the
**complexity curve** / **UI-development curve**: "easy for the first 20% of development but
increasingly restrictive for the remaining 80%" (research Turn 7 — _hidden friction_; not a numbered
product section — curves surface the research's "minimize the complexity curve, not just the learning
curve"). Each metric is a curve plus a **written finding**.

## Data needs

`Metric(ownerId, visibility, techId, key, axis, points, finding)` where
`axis = { key, label: LocalizedString, unit? }` and `points: { x, y }[]` · `Tech` — see
[0004](../decisions/0004-domain-model-v2.md). Multiple metrics per tech = multiple `Metric` docs.

## Sections

### 1. Header

- **Purpose:** frame the page.
- **Content:** title + one line explaining curves are multi-metric (learning, complexity, UI, productivity…).
- **Priority:** P1.

### 2. Metric switcher / legend

- **Purpose:** choose which metric(s) to view.
- **Content:** one metric highlighted; others toggleable as overlays; legend with tokens-colored series.
- **Interactions:** toggle series; select a tech.
- **Priority:** P1.

### 3. Curve chart

- **Purpose:** the visualization.
- **Content:** line/area chart (Recharts) — x = axis (effort/time/proficiency), y = metric value;
  one line per tech.
- **States:** default · loading · empty · error.
- **Priority:** P1.

### 4. Findings

- **Purpose:** the written conclusion beside the chart.
- **Content:** the `finding` text per metric/tech; links to evidence.
- **Priority:** P1.

### 5. Curve editor (admin)

- **Purpose:** edit axis, points + finding.
- **Content:** add/remove points, set the `axis` label/unit, write the `finding` (LocalizedString).
- **Priority:** P2.

## TDAIM notes

- Chart colors come from theme tokens so they hold AA and read correctly in dark/light; axis
  direction follows the locale (RTL flips time axis left↔right only intentionally).

## Notes

- The axis is now modeled per metric (`Metric.axis`, [0004](../decisions/0004-domain-model-v2.md)),
  so it is author-defined (effort/time/proficiency/complexity level) rather than fixed by the UI.

## Open questions

- Default metric set shown first (learning vs complexity vs UI curve).
