import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  comparisonsApi,
  decisionsApi,
  focusApi,
  metricsApi,
  notesApi,
  roadmapsApi,
  stepsApi,
  type DecisionInput,
  type FocusInput,
  type NoteInput,
  type RoadmapInput,
  type StepInput,
} from './api';
import type {
  AuthSession,
  Comparison,
  DecisionRecord,
  ID,
  LocalizedString,
  Note,
  Progress,
  Roadmap,
  Step,
  Visibility,
} from '@shared/index';

export const sessionQueryKey = ['session'] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => (await api.get<AuthSession>('/api/auth/session')).data,
    staleTime: 60_000,
  });
}

export const ownerRoadmapsQueryKey = ['roadmaps', 'owner'] as const;
export const publicRoadmapsQueryKey = ['roadmaps', 'public'] as const;

export function useHomeRoadmaps(owner: boolean) {
  return useQuery({
    queryKey: owner ? ownerRoadmapsQueryKey : publicRoadmapsQueryKey,
    queryFn: () => roadmapsApi.list(owner ? 'owner' : 'public'),
  });
}

export function useOwnerRoadmaps(enabled: boolean) {
  return useQuery({
    queryKey: ownerRoadmapsQueryKey,
    queryFn: () => roadmapsApi.list('owner'),
    enabled,
  });
}

export function useOwnerRoadmap(id: ID | undefined) {
  return useQuery({
    queryKey: ['roadmaps', id],
    queryFn: () => roadmapsApi.get(id as ID),
    enabled: Boolean(id),
  });
}

export function useRoadmapSteps(id: ID | undefined) {
  return useQuery({
    queryKey: ['roadmaps', id, 'steps'],
    queryFn: () => roadmapsApi.steps(id as ID),
    enabled: Boolean(id),
  });
}

export function useRoadmapProgress(id: ID | undefined, enabled = Boolean(id)) {
  return useQuery({
    queryKey: ['roadmaps', id, 'progress'],
    queryFn: () => roadmapsApi.progress(id as ID),
    enabled: Boolean(id) && enabled,
  });
}

export function useFocus(enabled: boolean) {
  return useQuery({
    queryKey: ['focus'],
    queryFn: focusApi.get,
    enabled,
  });
}

export function useSetFocus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FocusInput) => focusApi.update(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['focus'] });
    },
  });
}

export function useCreateRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoadmapInput) => roadmapsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownerRoadmapsQueryKey });
    },
  });
}

export function useUpdateRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<RoadmapInput> }) =>
      roadmapsApi.update(id, input),
    onSuccess: (roadmap: Roadmap) => {
      void queryClient.invalidateQueries({ queryKey: ownerRoadmapsQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['roadmaps', roadmap.id] });
    },
    onError: (error: { status?: number }) => {
      if (error.status === 409) {
        // Revision conflict: invalidate so the user sees current state on retry.
        void queryClient.invalidateQueries({ queryKey: ownerRoadmapsQueryKey });
      }
    },
  });
}

export function useDeleteRoadmap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => roadmapsApi.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: ownerRoadmapsQueryKey });
      void queryClient.removeQueries({ queryKey: ['roadmaps', id] });
    },
  });
}

export function useAddStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, input }: { roadmapId: ID; input: StepInput }) =>
      roadmapsApi.addStep(roadmapId, input),
    onSuccess: (_step, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['roadmaps', variables.roadmapId, 'steps'] });
    },
  });
}

export function useUpdateStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; roadmapId: ID; input: Partial<StepInput> }) =>
      stepsApi.update(id, input),
    onSuccess: (_step, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['roadmaps', variables.roadmapId, 'steps'] });
    },
    onError: (error: { status?: number }) => {
      if (error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ownerRoadmapsQueryKey });
      }
    },
  });
}

export function useDeleteStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: ID; roadmapId: ID }) => stepsApi.remove(id),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['roadmaps', variables.roadmapId, 'steps'] });
      void queryClient.invalidateQueries({
        queryKey: ['roadmaps', variables.roadmapId, 'progress'],
      });
    },
  });
}

export function useSetStepProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      stepId,
      done,
      status,
      percent,
    }: {
      roadmapId: ID;
      stepId: ID;
      done?: boolean;
      status?: string;
      percent?: number;
    }) => stepsApi.setProgress(stepId, { done, status, percent }),
    onSuccess: (_progress: Progress, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['roadmaps', variables.roadmapId, 'progress'],
      });
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export interface RoadmapDraft {
  title: string;
  titleAr: string;
  description: string;
  topics: string;
  kind: 'hub' | 'tech' | 'pipeline';
  visibility: Visibility;
  /** Catalogue id (`t-react`, …) for technology roadmaps. */
  techId: string;
}

/** Turns the plain form fields into the localized payload the API expects. */
export function toRoadmapInput(draft: RoadmapDraft): RoadmapInput {
  const title: LocalizedString = draft.titleAr
    ? { en: draft.title, ar: draft.titleAr }
    : { en: draft.title };

  return {
    title,
    kind: draft.kind,
    visibility: draft.visibility,
    ...(draft.description ? { description: { en: draft.description } } : {}),
    ...(draft.kind === 'tech' && draft.techId ? { techId: draft.techId } : {}),
    topics: draft.topics
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean),
  };
}

export type { Step };

export const publicNotesQueryKey = ['notes', 'public'] as const;
export const ownerNotesQueryKey = ['notes', 'owner'] as const;

export function usePublicNotes() {
  return useQuery({
    queryKey: publicNotesQueryKey,
    queryFn: () => notesApi.list('public'),
  });
}

export function useOwnerNotes(enabled: boolean) {
  return useQuery({
    queryKey: ownerNotesQueryKey,
    queryFn: () => notesApi.list('owner'),
    enabled,
  });
}

export function useNote(id: ID | undefined) {
  return useQuery({
    queryKey: ['notes', id],
    queryFn: () => notesApi.get(id as ID),
    enabled: Boolean(id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteInput) => notesApi.create(input),
    onSuccess: (note: Note) => {
      queryClient.setQueryData<Note[]>(ownerNotesQueryKey, (items = []) => [...items, note]);
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<NoteInput> }) =>
      notesApi.update(id, input),
    onSuccess: (note: Note) => {
      queryClient.setQueryData<Note[]>(ownerNotesQueryKey, (items = []) =>
        items.map((item) => (item.id === note.id ? note : item)),
      );
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => notesApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Note[]>(ownerNotesQueryKey, (items = []) =>
        items.filter((item) => item.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export const publicDecisionsQueryKey = ['decisions', 'public'] as const;
export const ownerDecisionsQueryKey = ['decisions', 'owner'] as const;

export function usePublicDecisions() {
  return useQuery({
    queryKey: publicDecisionsQueryKey,
    queryFn: () => decisionsApi.list('public'),
  });
}

export function useOwnerDecisions(enabled: boolean) {
  return useQuery({
    queryKey: ownerDecisionsQueryKey,
    queryFn: () => decisionsApi.list('owner'),
    enabled,
  });
}

export function useDecision(id: ID | undefined) {
  return useQuery({
    queryKey: ['decisions', id],
    queryFn: () => decisionsApi.get(id as ID),
    enabled: Boolean(id),
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DecisionInput) => decisionsApi.create(input),
    onSuccess: (decision: DecisionRecord) => {
      queryClient.setQueryData<DecisionRecord[]>(ownerDecisionsQueryKey, (items = []) => [
        ...items,
        decision,
      ]);
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useUpdateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<DecisionInput> }) =>
      decisionsApi.update(id, input),
    onSuccess: (decision: DecisionRecord) => {
      queryClient.setQueryData<DecisionRecord[]>(ownerDecisionsQueryKey, (items = []) =>
        items.map((item) => (item.id === decision.id ? decision : item)),
      );
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useDeleteDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => decisionsApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<DecisionRecord[]>(ownerDecisionsQueryKey, (items = []) =>
        items.filter((item) => item.id !== id),
      );
      void queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useComparisons(scope: 'public' | 'owner' = 'public') {
  const { data: session } = useSession();
  const enabled = scope === 'public' || Boolean(session?.authenticated);
  return useQuery({
    queryKey: ['comparisons', scope],
    queryFn: () => comparisonsApi.list(scope),
    enabled,
    staleTime: 60_000,
  });
}

export function useComparison(id?: ID) {
  const enabled = Boolean(id);
  return useQuery({
    queryKey: ['comparisons', id],
    queryFn: () => comparisonsApi.getById(id as ID),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateComparison() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Comparison>) => comparisonsApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
  });
}

export function useUpdateComparison() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: ID; input: Partial<Comparison> }) =>
      comparisonsApi.update(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] });
      void queryClient.invalidateQueries({ queryKey: ['comparisons', variables.id] });
    },
  });
}

export function useDeleteComparison() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ID) => comparisonsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comparisons'] });
    },
  });
}

export const publicMetricsQueryKey = ['metrics', 'public'] as const;
export const ownerMetricsQueryKey = ['metrics', 'owner'] as const;

export function useMetrics(scope: 'public' | 'owner' = 'public') {
  const { data: session } = useSession();
  const enabled = scope === 'public' || Boolean(session?.authenticated);
  return useQuery({
    queryKey: ['metrics', scope],
    queryFn: () => metricsApi.list(scope),
    enabled,
    staleTime: 60_000,
  });
}
