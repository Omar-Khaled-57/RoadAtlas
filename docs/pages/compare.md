# Compare — `/compare`

**Priority:** P1 · **Status:** Spec

## Purpose

Side-by-side evaluation of technologies (React Native vs KMP vs Flutter, …) with **custom criteria,
weighted scores, hidden friction, evidence and a conclusion** — "a record of why you chose one
technology over another" (research §2 → **02 — Technology Comparisons**).

## Data needs

`Comparison(ownerId, visibility, title, candidateTechIds[], criteria[], conclusion)` where
`Criterion = { id, name: LocalizedString, weight, scores: Record<techId, { value, note? }> }` ·
`Metric` · `Tech` — see [0004](../decisions/0004-domain-model-v2.md). Criteria are **data**, not
hardcoded columns (research §3).

## Sections

### 1. Header

- **Purpose:** context + the comparison selector.
- **Content:** title; pick the techs to compare (admin: create/save a comparison).
- **Priority:** P1.

### 2. Criteria table

- **Purpose:** the core side-by-side.
- **Content:** rows = criteria (custom, weighted); columns = techs; cells = score + note; a weighted
  total row.
- **Interactions:** adjust weights (admin); hover/focus a cell for its note; sort criteria.
- **States:** default · loading · empty (pick techs to begin) · error.
- **Priority:** P1.

### 3. Strengths & limitations

- **Purpose:** qualitative counterpart to the scores.
- **Content:** per-tech strengths and limitations.
- **Priority:** P1.

### 4. Hidden friction

- **Purpose:** capture what only shows up deep in use — the _complexity/UI curve_ idea.
- **Content:** per-tech friction notes (e.g. "pixel-perfect but poor at continuous DB calls").
- **Priority:** P1.

### 5. Sources & evidence

- **Purpose:** make conclusions defensible.
- **Content:** links/references backing the scores and notes.
- **Priority:** P2.

### 6. Conclusion

- **Purpose:** the decision and its reasoning, with a revisit date.
- **Content:** chosen tech, trade-offs, "what I learned"; may link to a `/decisions` record.
- **Priority:** P1.

## TDAIM notes

- Table must mirror under RTL; numeric columns use logical alignment; charts (if any) themed by tokens.

## Notes

- Criteria are independent of curve metrics (resolved in [0004](../decisions/0004-domain-model-v2.md));
  a metric may _seed_ a criterion, but they are stored separately.
- The Conclusion may link to a `/decisions` record (reserved).
