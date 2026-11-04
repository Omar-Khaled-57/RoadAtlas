import { Network, Route, Workflow, type LucideIcon } from 'lucide-react';
import type { RoadmapKind } from '@shared/index';

/** One icon + colour tone per roadmap kind, shared by the map, cards and badges. */
export const KIND_ICON: Record<RoadmapKind, LucideIcon> = {
  hub: Network,
  tech: Route,
  pipeline: Workflow,
};

export type Tone = 'primary' | 'secondary' | 'accent';

export const KIND_TONE: Record<RoadmapKind, Tone> = {
  hub: 'primary',
  tech: 'secondary',
  pipeline: 'accent',
};

/**
 * Which child kinds each parent kind may contain — mirrors the server rule in
 * `server/src/routes/roadmaps.ts`. A hub is the top-level container (hub, tech
 * or pipeline children); every other kind only nests its own kind.
 */
const CHILD_KINDS: Record<RoadmapKind, readonly RoadmapKind[]> = {
  hub: ['hub', 'tech', 'pipeline'],
  tech: ['tech'],
  pipeline: ['pipeline'],
};

export function childKindsFor(parentKind: RoadmapKind): RoadmapKind[] {
  return [...CHILD_KINDS[parentKind]];
}

export function canContain(parentKind: RoadmapKind | undefined, childKind: RoadmapKind): boolean {
  return parentKind ? (CHILD_KINDS[parentKind]?.includes(childKind) ?? false) : false;
}
