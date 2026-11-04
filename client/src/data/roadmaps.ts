import type {
  ID,
  LocalizedString,
  PipelineStage,
  Roadmap,
  RoadmapKind,
  RoadmapStatus as DomainRoadmapStatus,
  Step,
} from '@shared/index';

/**
 * Roadmap data layer — server-backed helpers only.
 *
 * Roadmap content is loaded from persisted `Roadmap` + `Step` records.
 */

/** Display status used by badges and filters (hyphenated copy keys). */
export type RoadmapDisplayStatus = 'planned' | 'in-progress' | 'completed' | 'paused';

/** A persisted `Step` plus the owner's `done` flag, merged by the graph layer. */
export interface RoadmapStep extends Step {
  done: boolean;
}

export const PIPELINE_STAGES: PipelineStage[] = ['idea', 'design', 'build', 'ship', 'done'];

/** The stage of the first unfinished step, or the last stage once everything is done. */
export function currentStage(roadmap: {
  steps?: Array<{ stage?: PipelineStage; done?: boolean }>;
}): PipelineStage | undefined {
  const staged = (roadmap.steps ?? []).filter((step) => step.stage);
  if (staged.length === 0) return undefined;
  const next = staged.find((step) => !step.done);
  return next?.stage ?? PIPELINE_STAGES[PIPELINE_STAGES.length - 1];
}

export function stageSteps(
  roadmap: { steps?: Array<{ stage?: PipelineStage }> },
  stage: PipelineStage,
): RoadmapStep[] {
  return (roadmap.steps ?? []).filter((step) => step.stage === stage) as RoadmapStep[];
}

export function pipelineRoadmaps(roadmaps: Roadmap[]): Roadmap[] {
  return roadmaps.filter((roadmap) => roadmap.kind === 'pipeline');
}

export function roadmapProgress(roadmap: { steps?: Array<{ done?: boolean }> }): number {
  const steps = roadmap.steps ?? [];
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => step.done).length;
  return Math.round((done / steps.length) * 100);
}

const DISPLAY_STATUS: Record<DomainRoadmapStatus, RoadmapDisplayStatus> = {
  planned: 'planned',
  in_progress: 'in-progress',
  finished: 'completed',
  paused: 'paused',
};

export function roadmapStatus(roadmap: {
  paused?: boolean;
  status?: DomainRoadmapStatus;
  steps?: Array<{ done?: boolean }>;
}): RoadmapDisplayStatus {
  if (roadmap.paused || roadmap.status === 'paused') return 'paused';
  if (roadmap.status) return DISPLAY_STATUS[roadmap.status];
  const progress = roadmapProgress(roadmap);
  if (progress >= 100) return 'completed';
  if (progress <= 0) return 'planned';
  return 'in-progress';
}

export interface RoadmapSummary {
  id: ID;
  ownerId: ID;
  kind: RoadmapKind;
  title: LocalizedString;
  progress: number;
  stepCount: number;
}

export function roadmapSummary(roadmap: {
  id: ID;
  ownerId: ID;
  kind: RoadmapKind;
  title: LocalizedString;
  steps: RoadmapStep[];
}): RoadmapSummary {
  return {
    id: roadmap.id,
    ownerId: roadmap.ownerId,
    kind: roadmap.kind,
    title: roadmap.title,
    progress: roadmapProgress(roadmap),
    stepCount: roadmap.steps.length,
  };
}

export function getRoadmap<T extends { id: ID }>(roadmaps: T[], id: ID | undefined): T | undefined {
  return id ? roadmaps.find((roadmap) => roadmap.id === id) : undefined;
}

export function childRoadmaps<T extends { id: ID; parentId?: ID | undefined; order: number }>(
  roadmaps: T[],
  id: ID,
): T[] {
  return roadmaps.filter((roadmap) => roadmap.parentId === id).sort((a, b) => a.order - b.order);
}
