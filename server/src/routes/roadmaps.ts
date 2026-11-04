import { Router } from 'express';
import { ProgressModel, RoadmapModel, StepModel } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { redactPublic, toProgressDto, toRoadmapDto, toStepDto } from '../lib/dto';
import { callerId, isReadable, optionalCallerId, scopeFilter } from '../lib/scope';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  createRoadmapSchema,
  createStepSchema,
  listQuerySchema,
  objectIdSchema,
  updateRoadmapSchema,
} from '../validation/schemas';

export const roadmapsRouter = Router();

/**
 * Which child kinds a parent of each kind may contain.
 *
 * A hub is the top-level container: it may hold hubs, technologies and
 * pipelines (the map on `/map` is exactly that picture). Every other kind
 * only holds its own kind, so `tech → tech` and `pipeline → pipeline` stay
 * unchanged. The client mirrors this rule in `client/src/lib/roadmapMeta.ts`.
 */
const CHILD_KINDS: Record<string, readonly string[]> = {
  hub: ['hub', 'tech', 'pipeline'],
  tech: ['tech'],
  pipeline: ['pipeline'],
};

function canContain(parentKind: string, childKind: string): boolean {
  return CHILD_KINDS[parentKind]?.includes(childKind) ?? false;
}

function parentKindMessage(parentKind: string, childKind: string): string {
  return `A ${parentKind} roadmap cannot contain a ${childKind} roadmap.`;
}

/** Remove `undefined` entries so a partial update never clears a field by accident. */
function definedEntries(input: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  if ('revision' in entries && typeof entries.revision === 'number') {
    entries.revision = (entries.revision ?? 0) + 1;
    return entries;
  }
  return entries;
}

/** True when pointing `childId` at `parentId` would close a parent chain cycle. */
async function createsParentCycle(childId: string, parentId: string): Promise<boolean> {
  let cursor: string | undefined = parentId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor) && seen.size < 100) {
    if (cursor === childId) return true;
    seen.add(cursor);
    const node: { parentId?: unknown } | null = await RoadmapModel.findById(cursor)
      .select('parentId')
      .lean();
    cursor = node?.parentId ? String(node.parentId) : undefined;
  }
  return false;
}

roadmapsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public' } = parseOrThrow(listQuerySchema, req.query);
  const filter = scopeFilter(scope, optionalCallerId(res));
  const docs = await RoadmapModel.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  const items = docs.map((doc) => {
    const dto = toRoadmapDto(doc) as unknown as Record<string, unknown>;
    // Only anonymous readers lose `ownerId`; signed-in callers need it to detect
    // their own public records (ownership checks and edit affordances).
    if (!optionalCallerId(res)) {
      const rest = redactPublic(dto);
      return rest;
    }
    return dto;
  });
  res.json({ items });
});

roadmapsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await RoadmapModel.findById(id).lean();
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Roadmap not found.');
  const dto = toRoadmapDto(doc) as unknown as Record<string, unknown>;
  if (doc.visibility === 'public' && !optionalCallerId(res)) {
    const rest = redactPublic(dto);
    res.json(rest);
    return;
  }
  res.json(dto);
});

roadmapsRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createRoadmapSchema, req.body);
  const ownerId = callerId(res);
  const { steps, ...roadmapInput } = input;

  if (roadmapInput.parentId) {
    const parent = await RoadmapModel.findOne({ _id: roadmapInput.parentId, ownerId })
      .select('kind')
      .lean();
    if (!parent) {
      res.status(400).json({ message: 'Parent roadmap not found.' });
      return;
    }
    if (!canContain(parent.kind, roadmapInput.kind)) {
      res.status(400).json({ message: parentKindMessage(parent.kind, roadmapInput.kind) });
      return;
    }
  }

  const roadmap = await RoadmapModel.create({ ...roadmapInput, ownerId });
  if (steps?.length) {
    await StepModel.insertMany(
      steps.map((step, index) => ({
        ...step,
        ownerId,
        roadmapId: roadmap._id,
        order: step.order ?? index,
      })),
    );
  }

  const created = await RoadmapModel.findById(roadmap._id).lean();
  res.status(201).json(toRoadmapDto(created));
});

roadmapsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateRoadmapSchema, req.body);
  const ownerId = callerId(res);

  if ('parentId' in input && input.parentId) {
    if (input.parentId === id) {
      res.status(400).json({ message: 'A roadmap cannot be its own parent.' });
      return;
    }
    const current = await RoadmapModel.findOne({ _id: id, ownerId }).select('kind').lean();
    if (!current) throw notFound('Roadmap not found.');
    const parent = await RoadmapModel.findOne({ _id: input.parentId, ownerId })
      .select('kind parentId')
      .lean();
    if (!parent) {
      res.status(400).json({ message: 'Parent roadmap not found.' });
      return;
    }
    if (await createsParentCycle(id, input.parentId)) {
      res.status(400).json({ message: 'Circular parent-child relationship.' });
      return;
    }
    const effectiveKind = input.kind ?? current.kind;
    if (!canContain(parent.kind, effectiveKind)) {
      res.status(400).json({ message: parentKindMessage(parent.kind, effectiveKind) });
      return;
    }
  }

  // A kind change must stay consistent with the existing parent and children too,
  // otherwise parentage becomes cross-kind through the back door.
  if (input.kind) {
    const nextKind = input.kind;
    const current = await RoadmapModel.findOne({ _id: id, ownerId }).select('parentId').lean();
    if (!current) throw notFound('Roadmap not found.');

    if (!('parentId' in input) && current.parentId) {
      const parent = await RoadmapModel.findById(current.parentId).select('kind').lean();
      if (parent && !canContain(parent.kind, nextKind)) {
        res.status(400).json({ message: parentKindMessage(parent.kind, nextKind) });
        return;
      }
    }

    const childKinds = (await RoadmapModel.distinct('kind', { parentId: id })) as string[];
    const mismatchedChildKind = childKinds.find((kind) => !canContain(nextKind, kind));
    if (mismatchedChildKind) {
      res.status(400).json({ message: parentKindMessage(nextKind, mismatchedChildKind) });
      return;
    }
  }

  const update = { ...input };
  if ('revision' in update && typeof update.revision === 'number') {
    const existing = await RoadmapModel.findOne({ _id: id, ownerId }).select('revision').lean();
    if (existing && existing.revision !== update.revision) {
      res.status(409).json({ message: 'Conflict: roadmap was updated elsewhere.' });
      return;
    }
  }

  const updated = await RoadmapModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: definedEntries(update) },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) throw notFound('Roadmap not found.');
  res.json(toRoadmapDto(updated));
});

roadmapsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const children = await RoadmapModel.countDocuments({ parentId: id, ownerId });
  if (children > 0) {
    res.status(400).json({ message: 'Reparent or remove child roadmaps before deleting.' });
    return;
  }

  const deleted = await RoadmapModel.findOneAndDelete({ _id: id, ownerId });
  if (!deleted) throw notFound('Roadmap not found.');

  const steps = await StepModel.find({ roadmapId: id, ownerId }).select('_id').lean();
  await StepModel.deleteMany({ roadmapId: id, ownerId });
  await ProgressModel.deleteMany({ ownerId, stepId: { $in: steps.map((step) => step._id) } });

  res.status(204).end();
});

roadmapsRouter.get('/:id/steps', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const roadmap = await RoadmapModel.findById(id).lean();
  if (!roadmap || !isReadable(roadmap, optionalCallerId(res))) throw notFound('Roadmap not found.');
  const caller = optionalCallerId(res);

  const steps = await StepModel.find({ roadmapId: id }).sort({ order: 1 }).lean();
  const items = steps.map((step) => {
    const dto = toStepDto(step) as unknown as Record<string, unknown>;
    if (roadmap.visibility === 'public' && !caller) {
      const { ownerId: _ownerId, done: _done, note: _note, ...rest } = dto;
      return rest;
    }
    return dto;
  });
  res.json({ items });
});

roadmapsRouter.post('/:id/steps', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(createStepSchema, req.body);
  const ownerId = callerId(res);

  const roadmap = await RoadmapModel.findOne({ _id: id, ownerId });
  if (!roadmap) throw notFound('Roadmap not found.');

  const count = await StepModel.countDocuments({ roadmapId: id });
  const step = await StepModel.create({
    ...input,
    ownerId,
    roadmapId: id,
    order: input.order ?? count,
  });

  res.status(201).json(toStepDto(step.toObject()));
});

roadmapsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const roadmap = await RoadmapModel.findOne({ _id: id, ownerId });
  if (!roadmap) throw notFound('Roadmap not found.');

  const steps = await StepModel.find({ roadmapId: id, ownerId }).select('_id').lean();
  const items = await ProgressModel.find({
    ownerId,
    stepId: { $in: steps.map((step) => step._id) },
  }).lean();

  res.json({ items: items.map(toProgressDto) });
});
