export type ID = string;

export interface HealthResponse {
  status: string;
  service: string;
  time: string;
  uptimeSeconds?: number;
  database?: 'connected' | 'disconnected' | 'disabled';
}

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
export type RoadmapStatus = 'planned' | 'in_progress' | 'finished' | 'paused';

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
  prerequisites?: string[];
  topics?: string[];
  paused?: boolean;
  status?: RoadmapStatus;
  icon?: string;
  image?: string;
  revision?: number;
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
  note?: LocalizedString;
  done?: boolean;
  revision?: number;
  linkedRoadmapId?: ID | null;
  linkedStepId?: ID | null;
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
  chosenTechId?: ID | null;
  revisitAt?: string;
  evidence?: Link[];
  revision?: number;
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
  evidence?: Link[];
  revision?: number;
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
  revision?: number;
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
  revision?: number;
}

export interface FocusLastVisited {
  roadmapId: ID;
  stepId?: ID;
  at: string;
}

export type FocusItemKind = 'technology' | 'project' | 'milestone' | 'custom';

/** A home focus row points at persisted roadmap or step content. */
export interface FocusItem {
  id: ID;
  kind: FocusItemKind;
  targetId: ID;
  highlighted: boolean;
  title?: LocalizedString;
  href?: string;
}

export interface WeeklyFocusItem {
  id: ID;
  title: LocalizedString;
  highlighted: boolean;
}

export interface Focus {
  ownerId: ID;
  visibility: Visibility;
  currentTechId?: ID;
  currentProjectId?: ID;
  lastVisited?: FocusLastVisited;
  items: FocusItem[];
  weeklyFocus?: WeeklyFocusItem[];
  revision?: number;
  updatedAt: string;
}

export type StepProgressStatus =
  'not_started' | 'in_progress' | 'partially_done' | 'done' | 'revisit' | 'test' | 'revise';

export interface Progress extends Timestamps {
  id: ID;
  ownerId: ID;
  stepId: ID;
  done: boolean;
  status?: StepProgressStatus;
  percent?: number;
  completedAt?: string | null;
}

export interface ApiError {
  message: string;
  details?: unknown;
  /** Correlates a client-visible failure with server logs. */
  requestId?: string;
}

export interface AuthUser {
  id: ID;
  email: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
