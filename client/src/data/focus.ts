import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ID } from '@shared/index';
import { seedTechProfiles } from './comparisons';
import {
  useFocus,
  useOwnerRoadmaps,
  useRoadmapProgress,
  useRoadmapSteps,
  useSession,
} from './queries';
import { localize } from '../lib/localize';

export interface FocusProject {
  id: ID;
  title: string;
}

export interface FocusVisit {
  roadmapId: ID;
  title: string;
  percent: number;
  nextStepTitle?: string;
  at: string;
}

export interface FocusView {
  /** The owner is signed in and the API reported a focus record. */
  ready: boolean;
  currentTechId?: string;
  currentProjectId?: ID;
  currentTech?: string;
  currentProject?: FocusProject;
  lastVisited?: FocusVisit;
  loading: boolean;
}

/**
 * Resolves the owner's focus record into the labels the home page shows.
 * Everything is read from the API: the client never keeps a private copy.
 */
export function useFocusView(): FocusView {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);

  const focus = useFocus(authenticated);
  const roadmaps = useOwnerRoadmaps(authenticated);
  const visitId = focus.data?.lastVisited?.roadmapId;
  const steps = useRoadmapSteps(visitId);
  const progress = useRoadmapProgress(visitId);

  return useMemo(() => {
    const items = roadmaps.data ?? [];
    const record = focus.data;

    const tech = record?.currentTechId
      ? seedTechProfiles.find((profile) => profile.id === record.currentTechId)
      : undefined;
    const project = record?.currentProjectId
      ? items.find((roadmap) => roadmap.id === record.currentProjectId)
      : undefined;

    const visit = record?.lastVisited
      ? items.find((roadmap) => roadmap.id === record.lastVisited?.roadmapId)
      : undefined;

    const visitSteps = steps.data ?? [];
    const doneIds = new Set(
      (progress.data ?? []).filter((entry) => entry.done).map((entry) => entry.stepId),
    );
    const percent =
      visitSteps.length === 0
        ? 0
        : Math.round(
            (visitSteps.filter((step) => doneIds.has(step.id)).length / visitSteps.length) * 100,
          );
    const nextStep = visitSteps.find((step) => !doneIds.has(step.id));

    return {
      ready: authenticated && Boolean(record),
      currentTechId: record?.currentTechId ?? undefined,
      currentProjectId: record?.currentProjectId ?? undefined,
      currentTech: tech ? localize(tech.name, lang) : undefined,
      currentProject: project
        ? { id: project.id, title: localize(project.title, lang) }
        : undefined,
      lastVisited:
        visit && record?.lastVisited
          ? {
              roadmapId: visit.id,
              title: localize(visit.title, lang),
              percent,
              nextStepTitle: nextStep ? localize(nextStep.title, lang) : undefined,
              at: record.lastVisited.at,
            }
          : undefined,
      loading: authenticated && (focus.isPending || roadmaps.isPending),
    };
  }, [
    authenticated,
    focus.data,
    focus.isPending,
    lang,
    progress.data,
    roadmaps.data,
    roadmaps.isPending,
    steps.data,
  ]);
}
