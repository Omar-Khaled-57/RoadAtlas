import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FocusItem, FocusItemKind, ID } from '@shared/index';
import { roadmapsApi } from './api';
import { useFocus, useOwnerRoadmaps, useRoadmapProgress, useSession } from './queries';
import { localize } from '../lib/localize';

export interface FocusViewItem extends Omit<FocusItem, 'title'> {
  title: string;
  subtitle: string;
  href: string;
  percent: number;
}

export interface FocusVisit {
  roadmapId: ID;
  title: string;
  percent: number;
  nextStepTitle?: string;
  nextStepId?: ID;
  at: string;
}

export interface FocusView {
  ready: boolean;
  items: FocusViewItem[];
  lastVisited?: FocusVisit;
  loading: boolean;
}

const ITEM_COPY: Record<FocusItemKind, { label: string; subtitle: string }> = {
  technology: { label: 'home.focusTech', subtitle: 'home.currentTech' },
  project: { label: 'home.focusProject', subtitle: 'home.currentProject' },
  milestone: { label: 'home.nextMilestone', subtitle: 'home.upNext' },
  custom: { label: 'focusPanel.custom' as string, subtitle: 'focusPanel.customSubtitle' as string },
} as const;

/** Resolves owner focus rows and progress from persisted roadmap/step records. */
export function useFocusView(): FocusView {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { data: session } = useSession();
  const authenticated = Boolean(session?.authenticated);
  const focus = useFocus(authenticated);
  const roadmaps = useOwnerRoadmaps(authenticated);
  const roadmapItems = useMemo(() => roadmaps.data ?? [], [roadmaps.data]);
  const stepQueries = useQueries({
    queries: roadmapItems.map((roadmap) => ({
      queryKey: ['roadmaps', roadmap.id, 'steps'],
      queryFn: () => roadmapsApi.steps(roadmap.id),
      enabled: authenticated,
    })),
  });
  const progressQueries = useQueries({
    queries: roadmapItems.map((roadmap) => ({
      queryKey: ['roadmaps', roadmap.id, 'progress'],
      queryFn: () => roadmapsApi.progress(roadmap.id),
      enabled: authenticated,
    })),
  });
  const visitId = focus.data?.lastVisited?.roadmapId;
  const progress = useRoadmapProgress(visitId);

  return useMemo(() => {
    const allSteps = stepQueries.flatMap((query) => query.data ?? []);
    const allProgress = progressQueries.flatMap((query) => query.data ?? []);
    const items = (focus.data?.items ?? []).flatMap((item): FocusViewItem[] => {
      if (item.kind === 'custom') {
        return [
          {
            ...item,
            title: item.title ? localize(item.title, lang) : item.targetId,
            subtitle: item.href ?? '',
            href: item.href ?? '#',
            percent: 0,
          },
        ];
      }
      if (item.kind === 'milestone') {
        const step = allSteps.find((entry) => entry.id === item.targetId);
        const roadmap = step && roadmapItems.find((entry) => entry.id === step.roadmapId);
        if (!step || !roadmap) return [];
        const stepDone = allProgress.some((entry) => entry.stepId === step.id && entry.done);
        return [
          {
            ...item,
            title: localize(step.title, lang),
            subtitle: localize(roadmap.title, lang),
            href: `/roadmaps/${roadmap.id}#step-${step.id}`,
            percent: stepDone ? 100 : 0,
          },
        ];
      }
      const roadmap = roadmapItems.find((entry) => entry.id === item.targetId);
      if (!roadmap) return [];
      const steps = allSteps.filter((entry) => entry.roadmapId === roadmap.id);
      const done = new Set(allProgress.filter((entry) => entry.done).map((entry) => entry.stepId));
      return [
        {
          ...item,
          title: localize(roadmap.title, lang),
          subtitle: localize(roadmap.description ?? roadmap.title, lang),
          href: `/roadmaps/${roadmap.id}`,
          percent: steps.length
            ? Math.round((steps.filter((step) => done.has(step.id)).length / steps.length) * 100)
            : 0,
        },
      ];
    });

    const visit = focus.data?.lastVisited
      ? roadmapItems.find((entry) => entry.id === focus.data?.lastVisited?.roadmapId)
      : undefined;
    const visitSteps = visit
      ? allSteps.filter((step) => step.roadmapId === visit.id).sort((a, b) => a.order - b.order)
      : [];
    const doneIds = new Set(
      (progress.data ?? []).filter((entry) => entry.done).map((entry) => entry.stepId),
    );
    const percent = visitSteps.length
      ? Math.round(
          (visitSteps.filter((step) => doneIds.has(step.id)).length / visitSteps.length) * 100,
        )
      : 0;
    const nextStep = visitSteps.find((step) => !doneIds.has(step.id));

    return {
      ready: authenticated && Boolean(focus.data),
      items,
      lastVisited:
        visit && focus.data?.lastVisited
          ? {
              roadmapId: visit.id,
              title: localize(visit.title, lang),
              percent,
              nextStepTitle: nextStep ? localize(nextStep.title, lang) : undefined,
              nextStepId: nextStep?.id,
              at: focus.data.lastVisited.at,
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
    progressQueries,
    roadmapItems,
    roadmaps.isPending,
    stepQueries,
  ]);
}

export { ITEM_COPY };
