export type ID = string;

export type Visibility = 'public' | 'private';

export interface LocalizedString {
  en: string;
  ar?: string;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface Tech extends Timestamps {
  id: ID;
  name: string;
  category: string;
  color?: string;
  icon?: string;
  summary?: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  links: Link[];
}

export type RoadmapKind = 'hub' | 'tech' | 'pipeline';

export interface Roadmap extends Timestamps {
  id: ID;
  ownerId: ID;
  visibility: Visibility;
  kind: RoadmapKind;
  title: LocalizedString;
  description?: LocalizedString;
  parentId?: ID;
  techId?: ID;
  order: number;
}

export type PipelineStage = 'idea' | 'design' | 'build' | 'ship' | 'done';

export interface Step extends Timestamps {
  id: ID;
  ownerId: ID;
  roadmapId: ID;
  title: LocalizedString;
  description?: LocalizedString;
  resources: Link[];
  order: number;
  stage?: PipelineStage;
}

export interface CriterionScore {
  value: number;
  note?: LocalizedString;
}

export interface Criterion {
  id: ID;
  name: LocalizedString;
  weight: number;
  scores: Record<ID, CriterionScore>;
}

export interface Comparison extends Timestamps {
  id: ID;
  ownerId: ID;
  visibility: Visibility;
  title: LocalizedString;
  candidateTechIds: ID[];
  criteria: Criterion[];
  conclusion?: LocalizedString;
}

export interface MetricAxis {
  key: string;
  label: LocalizedString;
  unit?: string;
}

export interface MetricPoint {
  x: number;
  y: number;
}

export interface Metric extends Timestamps {
  id: ID;
  ownerId: ID;
  visibility: Visibility;
  techId: ID;
  key: string;
  axis: MetricAxis;
  points: MetricPoint[];
  finding: LocalizedString;
}

export type NoteTarget = 'roadmap' | 'step' | 'tech' | 'decision';

export interface Note extends Timestamps {
  id: ID;
  ownerId: ID;
  visibility: Visibility;
  targetType: NoteTarget;
  targetId: ID;
  title: LocalizedString;
  content: LocalizedString;
  tags: string[];
  references: string[];
}

export interface DecisionRecord extends Timestamps {
  id: ID;
  ownerId: ID;
  visibility: Visibility;
  context: LocalizedString;
  alternatives: LocalizedString[];
  decision: LocalizedString;
  consequences: LocalizedString;
  revisitAt?: string;
  links: Link[];
}

export interface FocusLastVisited {
  roadmapId: ID;
  stepId?: ID;
  at: string;
}

export interface Focus {
  ownerId: ID;
  visibility: Visibility;
  currentTechId?: ID;
  currentProjectId?: ID;
  lastVisited?: FocusLastVisited;
  updatedAt: string;
}

export interface Progress extends Timestamps {
  id: ID;
  ownerId: ID;
  stepId: ID;
  done: boolean;
  completedAt?: string;
}

export interface ApiError {
  message: string;
  details?: unknown;
}
