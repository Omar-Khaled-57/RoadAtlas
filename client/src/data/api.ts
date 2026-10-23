import { api } from '../lib/api';
import type {
  Comparison,
  DecisionRecord,
  Focus,
  ID,
  LocalizedString,
  Metric,
  Note,
  PipelineStage,
  Progress,
  Roadmap,
  RoadmapKind,
  Step,
  Visibility,
} from '@shared/index';

/** Typed access to the RoadAtlas API. The client never trusts its own copy of the data. */

export interface ItemsResponse<T> {
  items: T[];
}

export interface FocusInput {
  currentTechId?: string | null;
  currentProjectId?: ID | null;
  lastVisited?: { roadmapId: ID; stepId?: ID; at: string } | null;
}

export interface StepInput {
  title: LocalizedString;
  description?: LocalizedString;
  stage?: PipelineStage;
  resources?: { label: string; url: string }[];
}

export interface RoadmapInput {
  title: LocalizedString;
  description?: LocalizedString;
  kind: RoadmapKind;
  visibility?: Visibility;
  parentId?: string;
  techId?: string;
  steps?: StepInput[];
}

export const roadmapsApi = {
  list: async (scope: 'public' | 'owner'): Promise<Roadmap[]> =>
    (await api.get<ItemsResponse<Roadmap>>('/api/roadmaps', { params: { scope } })).data.items,
  get: async (id: ID): Promise<Roadmap> => (await api.get<Roadmap>(`/api/roadmaps/${id}`)).data,
  create: async (input: RoadmapInput): Promise<Roadmap> =>
    (await api.post<Roadmap>('/api/roadmaps', input)).data,
  update: async (id: ID, input: Partial<RoadmapInput>): Promise<Roadmap> =>
    (await api.patch<Roadmap>(`/api/roadmaps/${id}`, input)).data,
  remove: async (id: ID): Promise<void> => {
    await api.delete(`/api/roadmaps/${id}`);
  },
  steps: async (id: ID): Promise<Step[]> =>
    (await api.get<ItemsResponse<Step>>(`/api/roadmaps/${id}/steps`)).data.items,
  addStep: async (id: ID, input: StepInput): Promise<Step> =>
    (await api.post<Step>(`/api/roadmaps/${id}/steps`, input)).data,
  progress: async (id: ID): Promise<Progress[]> =>
    (await api.get<ItemsResponse<Progress>>(`/api/roadmaps/${id}/progress`)).data.items,
};

export const stepsApi = {
  update: async (id: ID, input: Partial<StepInput>): Promise<Step> =>
    (await api.patch<Step>(`/api/steps/${id}`, input)).data,
  remove: async (id: ID): Promise<void> => {
    await api.delete(`/api/steps/${id}`);
  },
  setProgress: async (id: ID, done: boolean): Promise<Progress> =>
    (await api.put<Progress>(`/api/steps/${id}/progress`, { done })).data,
};

export type NoteInput = Pick<
  Note,
  'targetType' | 'targetId' | 'title' | 'content' | 'tags' | 'references' | 'visibility'
>;

export const notesApi = {
  list: async (scope: 'public' | 'owner'): Promise<Note[]> =>
    (await api.get<ItemsResponse<Note>>('/api/notes', { params: { scope } })).data.items,
  get: async (id: ID): Promise<Note> => (await api.get<Note>(`/api/notes/${id}`)).data,
  create: async (input: NoteInput): Promise<Note> =>
    (await api.post<Note>('/api/notes', input)).data,
  update: async (id: ID, input: Partial<NoteInput>): Promise<Note> =>
    (await api.patch<Note>(`/api/notes/${id}`, input)).data,
  remove: async (id: ID): Promise<void> => {
    await api.delete(`/api/notes/${id}`);
  },
};

export const comparisonsApi = {
  list: async (scope: 'public' | 'owner'): Promise<Comparison[]> =>
    (await api.get<ItemsResponse<Comparison>>('/api/comparisons', { params: { scope } })).data
      .items,
};

export const metricsApi = {
  list: async (scope: 'public' | 'owner'): Promise<Metric[]> =>
    (await api.get<ItemsResponse<Metric>>('/api/metrics', { params: { scope } })).data.items,
};

export type DecisionInput = Pick<
  DecisionRecord,
  'context' | 'alternatives' | 'decision' | 'consequences' | 'revisitAt' | 'links' | 'visibility'
>;

export const decisionsApi = {
  list: async (scope: 'public' | 'owner'): Promise<DecisionRecord[]> =>
    (await api.get<ItemsResponse<DecisionRecord>>('/api/decisions', { params: { scope } })).data
      .items,
  get: async (id: ID): Promise<DecisionRecord> =>
    (await api.get<DecisionRecord>(`/api/decisions/${id}`)).data,
  create: async (input: DecisionInput): Promise<DecisionRecord> =>
    (await api.post<DecisionRecord>('/api/decisions', input)).data,
  update: async (id: ID, input: Partial<DecisionInput>): Promise<DecisionRecord> =>
    (await api.patch<DecisionRecord>(`/api/decisions/${id}`, input)).data,
  remove: async (id: ID): Promise<void> => {
    await api.delete(`/api/decisions/${id}`);
  },
};

export const focusApi = {
  get: async (): Promise<Focus> => (await api.get<Focus>('/api/focus')).data,
  update: async (input: FocusInput): Promise<Focus> =>
    (await api.put<Focus>('/api/focus', input)).data,
};
