import type {
  Comparison,
  Criterion,
  DecisionRecord,
  Focus,
  Link,
  LocalizedString,
  Metric,
  Note,
  Roadmap,
  RoadmapKind,
  Step,
  Visibility,
} from '@shared/index';

type Raw = Record<string, unknown>;

/** Mongo ids are exposed as strings; `null`/`undefined` become `undefined`. */
export function toId(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

function toLocalized(value: unknown): LocalizedString | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Raw;
  const en = typeof raw.en === 'string' ? raw.en : '';
  const ar = typeof raw.ar === 'string' && raw.ar.length > 0 ? raw.ar : undefined;
  return ar ? { en, ar } : { en };
}

function toLinks(value: unknown): Link[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const raw = entry as Raw;
    const label = typeof raw.label === 'string' ? raw.label : '';
    const url = typeof raw.url === 'string' ? raw.url : '';
    return label && url ? [{ label, url }] : [];
  });
}

function toStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}

/** Mongoose maps `scores` to a `Map`; lean objects expose it as a plain record. */
function toScores(value: unknown): Record<string, { value: number; note?: LocalizedString }> {
  const entries =
    value instanceof Map ? [...value.entries()] : Object.entries((value ?? {}) as Raw);

  const scores: Record<string, { value: number; note?: LocalizedString }> = {};
  for (const [techId, score] of entries) {
    if (!score || typeof score !== 'object') continue;
    const raw = score as Raw;
    const numeric = Number(raw.value);
    if (!Number.isFinite(numeric)) continue;
    const note = toLocalized(raw.note);
    scores[techId] = note ? { value: numeric, note } : { value: numeric };
  }
  return scores;
}

export function toRoadmapDto(input: unknown): Roadmap {
  const raw = (input ?? {}) as Raw;
  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    visibility: raw.visibility as Visibility,
    kind: raw.kind as RoadmapKind,
    title: toLocalized(raw.title) ?? { en: '' },
    description: toLocalized(raw.description),
    parentId: toId(raw.parentId),
    techId: typeof raw.techId === 'string' && raw.techId ? raw.techId : undefined,
    order: Number(raw.order ?? 0),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function toStepDto(input: unknown): Step {
  const raw = (input ?? {}) as Raw;
  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    roadmapId: toId(raw.roadmapId) ?? '',
    title: toLocalized(raw.title) ?? { en: '' },
    description: toLocalized(raw.description),
    resources: toLinks(raw.resources),
    order: Number(raw.order ?? 0),
    stage: (raw.stage ?? undefined) as Step['stage'],
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export interface ProgressDto {
  id: string;
  ownerId: string;
  stepId: string;
  done: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function toProgressDto(input: unknown): ProgressDto {
  const raw = (input ?? {}) as Raw;
  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    stepId: toId(raw.stepId) ?? '',
    done: Boolean(raw.done),
    completedAt: raw.completedAt ? toIso(raw.completedAt) : undefined,
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function toComparisonDto(input: unknown): Comparison {
  const raw = (input ?? {}) as Raw;
  const criteria: Criterion[] = (Array.isArray(raw.criteria) ? raw.criteria : []).flatMap(
    (entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const item = entry as Raw;
      const id = typeof item.id === 'string' ? item.id : '';
      const name = toLocalized(item.name);
      if (!id || !name) return [];
      const weight = Number(item.weight);
      return [
        { id, name, weight: Number.isFinite(weight) ? weight : 0, scores: toScores(item.scores) },
      ];
    },
  );

  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    visibility: raw.visibility as Visibility,
    title: toLocalized(raw.title) ?? { en: '' },
    candidateTechIds: toStrings(raw.candidateTechIds),
    criteria,
    conclusion: toLocalized(raw.conclusion),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function toMetricDto(input: unknown): Metric {
  const raw = (input ?? {}) as Raw;
  const axisRaw = (raw.axis ?? {}) as Raw;
  const points = (Array.isArray(raw.points) ? raw.points : []).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const point = entry as Raw;
    const x = Number(point.x);
    const y = Number(point.y);
    return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
  });

  const unit = typeof axisRaw.unit === 'string' && axisRaw.unit ? axisRaw.unit : undefined;

  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    visibility: raw.visibility as Visibility,
    techId: typeof raw.techId === 'string' ? raw.techId : '',
    key: typeof raw.key === 'string' ? raw.key : '',
    axis: {
      key: typeof axisRaw.key === 'string' ? axisRaw.key : '',
      label: toLocalized(axisRaw.label) ?? { en: '' },
      ...(unit ? { unit } : {}),
    },
    points,
    finding: toLocalized(raw.finding) ?? { en: '' },
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function toNoteDto(input: unknown): Note {
  const raw = (input ?? {}) as Raw;
  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    visibility: raw.visibility as Visibility,
    targetType: raw.targetType as Note['targetType'],
    targetId: typeof raw.targetId === 'string' ? raw.targetId : '',
    title: toLocalized(raw.title) ?? { en: '' },
    content: toLocalized(raw.content) ?? { en: '' },
    tags: toStrings(raw.tags),
    references: toStrings(raw.references),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function toDecisionDto(input: unknown): DecisionRecord {
  const raw = (input ?? {}) as Raw;
  const revisitAt = raw.revisitAt ? toIso(raw.revisitAt) : undefined;
  return {
    id: toId(raw._id) ?? '',
    ownerId: toId(raw.ownerId) ?? '',
    visibility: raw.visibility as Visibility,
    context: toLocalized(raw.context) ?? { en: '' },
    alternatives: (Array.isArray(raw.alternatives) ? raw.alternatives : [])
      .map((entry) => toLocalized(entry))
      .filter((entry): entry is LocalizedString => Boolean(entry)),
    decision: toLocalized(raw.decision) ?? { en: '' },
    consequences: toLocalized(raw.consequences) ?? { en: '' },
    revisitAt,
    links: toLinks(raw.links),
    createdAt: toIso(raw.createdAt),
    updatedAt: toIso(raw.updatedAt),
  };
}

export function toFocusDto(input: unknown): Focus {
  const raw = (input ?? {}) as Raw;
  const lastVisitedRaw = (raw.lastVisited ?? {}) as Raw;
  const roadmapId = toId(lastVisitedRaw.roadmapId);
  const stepId = toId(lastVisitedRaw.stepId);
  const at = lastVisitedRaw.at ? toIso(lastVisitedRaw.at) : undefined;

  return {
    ownerId: toId(raw.ownerId) ?? '',
    visibility: raw.visibility as Visibility,
    currentTechId:
      typeof raw.currentTechId === 'string' && raw.currentTechId ? raw.currentTechId : undefined,
    currentProjectId: toId(raw.currentProjectId),
    lastVisited: roadmapId && at ? { roadmapId, stepId, at } : undefined,
    updatedAt: toIso(raw.updatedAt),
  };
}
