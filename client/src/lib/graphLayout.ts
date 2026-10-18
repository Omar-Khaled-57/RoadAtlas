import type { ID, Roadmap } from '@shared/index';

export interface Point {
  x: number;
  y: number;
}

export interface LayoutOptions {
  /** Horizontal distance between depth levels. */
  xGap?: number;
  /** Vertical distance between sibling leaves. */
  yGap?: number;
}

/**
 * Lay out a forest of roadmaps (branching via `parentId`) left-to-right.
 * Depth drives the x axis; leaves are stacked on y and parents are centered
 * over their children, so parallel branches spread out and chains stay flat.
 * Coordinates are direction-neutral (RTL only mirrors the surrounding chrome).
 */
export function layoutRoadmaps(
  roadmaps: Roadmap[],
  { xGap = 288, yGap = 118 }: LayoutOptions = {},
): Record<ID, Point> {
  const ids = new Set(roadmaps.map((r) => r.id));
  const children = new Map<ID, Roadmap[]>();
  const roots: Roadmap[] = [];

  for (const r of roadmaps) {
    if (r.parentId && ids.has(r.parentId)) {
      const list = children.get(r.parentId) ?? [];
      list.push(r);
      children.set(r.parentId, list);
    } else {
      roots.push(r);
    }
  }

  const byOrder = (a: Roadmap, b: Roadmap) => a.order - b.order;
  roots.sort(byOrder);
  for (const list of children.values()) list.sort(byOrder);

  const positions: Record<ID, Point> = {};
  let cursor = 0;

  const visit = (node: Roadmap, depth: number): number => {
    const kids = children.get(node.id) ?? [];
    if (kids.length === 0) {
      const y = cursor;
      cursor += yGap;
      positions[node.id] = { x: depth * xGap, y };
      return y;
    }
    const childYs = kids.map((kid) => visit(kid, depth + 1));
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    positions[node.id] = { x: depth * xGap, y };
    return y;
  };

  for (const root of roots) visit(root, 0);

  return positions;
}
