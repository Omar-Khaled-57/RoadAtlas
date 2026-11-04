import type { ID } from '@shared/index';

/**
 * Comparisons data helpers — server-backed. No seed data here.
 *
 * `weightedScore` is a pure UI helper over a persisted `Comparison` document;
 * the scores, criteria, evidence, and conclusion all come from `/api/comparisons`.
 */

/** Weighted average (0-10) of a tech's criterion scores, or 0 when it has none. */
export function weightedScore(
  comparison: { criteria: Array<{ weight: number; scores: Record<ID, { value: number }> }> },
  techId: ID,
): number {
  let total = 0;
  let weight = 0;
  for (const criterion of comparison.criteria) {
    const score = criterion.scores[techId];
    if (!score) continue;
    total += score.value * criterion.weight;
    weight += criterion.weight;
  }
  return weight === 0 ? 0 : Math.round((total / weight) * 10) / 10;
}
