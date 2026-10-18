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
