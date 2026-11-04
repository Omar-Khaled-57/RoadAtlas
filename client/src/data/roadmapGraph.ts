import { useMemo } from 'react';
import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import type { LocalizedString, Progress, Roadmap, Step } from '@shared/index';
import { roadmapsApi } from './api';
import { useHomeRoadmaps, useSession } from './queries';
import { type RoadmapStep } from './roadmaps';

/**
 * The map, catalogue and detail views all read from the server: roadmaps plus
 * their steps and the owner's progress. The API list endpoint omits nested
 * steps, so this hook fans out to the existing per-roadmap endpoints (reusing
 * their cache keys) and merges everything into a `RoadmapView`.
 *
 * There is no client-side demo fallback: when the server returns no public
 * roadmaps, the view shows an empty state with a create/import CTA.
 */
export interface RoadmapGraph {
  roadmaps: RoadmapView[];
  isLoading: boolean;
  isError: boolean;
}

export interface RoadmapView extends Omit<Roadmap, 'topics' | 'prerequisites'> {
  topics: LocalizedString[];
  prerequisites: LocalizedString[];
  steps: RoadmapStep[];
}

const EMPTY_ROADMAPS: Roadmap[] = [];
const EMPTY_GRAPH: RoadmapView[] = [];

function toLocalizedStrings(values: string[] | undefined): LocalizedString[] {
  return (values ?? []).map((en) => ({ en }));
}

function mergeRoadmap(
  roadmap: Roadmap,
  steps: Step[] | undefined,
  progress: Progress[] | undefined,
): RoadmapView {
  // Owners get their progress records; anonymous viewers only get public steps.
  const done = progress
    ? new Set(progress.filter((entry) => entry.done).map((entry) => entry.stepId))
    : null;
  const mergedSteps: RoadmapStep[] = (steps ?? []).map((step) => ({
    ...step,
    done: done ? done.has(step.id) : false,
  }));

  return {
    ...roadmap,
    prerequisites: toLocalizedStrings(roadmap.prerequisites),
    topics: toLocalizedStrings(roadmap.topics),
    steps: mergedSteps,
  };
}

interface CombinedSteps {
  data: Array<Step[] | undefined>;
  isLoading: boolean;
}

interface CombinedProgress {
  data: Array<Progress[] | undefined>;
  isLoading: boolean;
}

/** `combine` callbacks must be stable so React Query can structurally share results. */
const combineSteps = (results: Array<UseQueryResult<Step[]>>): CombinedSteps => ({
  data: results.map((result) => result.data),
  isLoading: results.some((result) => result.isPending && result.fetchStatus !== 'idle'),
});

const combineProgress = (results: Array<UseQueryResult<Progress[]>>): CombinedProgress => ({
  data: results.map((result) => result.data),
  isLoading: results.some((result) => result.isPending && result.fetchStatus !== 'idle'),
});

export function useRoadmapGraph(): RoadmapGraph {
  const session = useSession();
  const authenticated = Boolean(session.data?.authenticated);
  const userId = session.data?.user?.id;
  const sessionPending = session.isPending;
  const list = useHomeRoadmaps(authenticated);
  const serverRoadmaps = list.data ?? EMPTY_ROADMAPS;

  const stepQueries = useQueries({
    queries: serverRoadmaps.map((roadmap) => ({
      queryKey: ['roadmaps', roadmap.id, 'steps'],
      queryFn: () => roadmapsApi.steps(roadmap.id),
    })),
    combine: combineSteps,
  });

  const progressQueries = useQueries({
    queries: serverRoadmaps.map((roadmap) => ({
      queryKey: ['roadmaps', roadmap.id, 'progress'],
      queryFn: () => roadmapsApi.progress(roadmap.id),
      enabled: authenticated && roadmap.ownerId === userId,
    })),
    combine: combineProgress,
  });

  const roadmaps = useMemo(() => {
    if (sessionPending) return EMPTY_GRAPH;
    return serverRoadmaps.map((roadmap, index) =>
      mergeRoadmap(roadmap, stepQueries.data[index], progressQueries.data[index]),
    );
  }, [serverRoadmaps, sessionPending, stepQueries, progressQueries]);

  const isError = list.isError;
  const isLoading =
    sessionPending || list.isPending || stepQueries.isLoading || progressQueries.isLoading;

  return { roadmaps, isLoading, isError };
}
