import { Router } from 'express';
import { db } from '../models/index';
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
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null),
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
    let node: { parentId: string | null } | null = null;
    node = await db.roadmap.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = node?.parentId ? String(node.parentId) : undefined;
  }
  return false;
}

roadmapsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public' } = parseOrThrow(listQuerySchema, req.query);
  const filter = scopeFilter(scope, optionalCallerId(res));
  const docs = await db.roadmap.findMany({
    where: filter,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
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
  const doc = await db.roadmap.findUnique({
    where: { id },
  });
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
    const parent = await db.roadmap.findUnique({
      where: { id: roadmapInput.parentId },
      select: { kind: true, ownerId: true },
    });
    if (!parent || parent.ownerId !== ownerId) {
      res.status(400).json({ message: 'Parent roadmap not found.' });
      return;
    }
    if (!canContain(parent.kind, roadmapInput.kind)) {
      res.status(400).json({ message: parentKindMessage(parent.kind, roadmapInput.kind) });
      return;
    }
  }

  const { description, techId, ...roadmapRest } = roadmapInput;
  const roadmap = await db.roadmap.create({
    data: {
      ...roadmapRest,
      ownerId,
      description: description ?? undefined,
      techId: techId ?? undefined,
      ...(steps?.length
        ? {
            steps: {
              create: steps.map((step, index) => ({
                title: step.title,
                description: step.description ?? undefined,
                resources: step.resources ?? [],
                order: step.order ?? index,
                stage: step.stage ?? undefined,
                note: step.note ?? undefined,
                done: step.done ?? undefined,
                ownerId,
                linkedRoadmapId: step.linkedRoadmapId ?? undefined,
                linkedStepId: step.linkedStepId ?? undefined,
              })),
            },
          }
        : {}),
    },
  });

  res.status(201).json(toRoadmapDto(roadmap));
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
    const current = await db.roadmap.findUnique({
      where: { id },
      select: { kind: true, ownerId: true },
    });
    if (!current || current.ownerId !== ownerId) throw notFound('Roadmap not found.');
    const parent = await db.roadmap.findUnique({
      where: { id: input.parentId },
      select: { kind: true, parentId: true, ownerId: true },
    });
    if (!parent || parent.ownerId !== ownerId) {
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
    const current = await db.roadmap.findUnique({
      where: { id },
      select: { parentId: true, ownerId: true },
    });
    if (!current || current.ownerId !== ownerId) throw notFound('Roadmap not found.');

    if (!('parentId' in input) && current.parentId) {
      const parent = await db.roadmap.findUnique({
        where: { id: current.parentId },
        select: { kind: true },
      });
      if (parent && !canContain(parent.kind, nextKind)) {
        res.status(400).json({ message: parentKindMessage(parent.kind, nextKind) });
        return;
      }
    }

    const children = await db.roadmap.findMany({
      where: { parentId: id },
      select: { kind: true },
    });
    const mismatchedChildKind = children.find((kind) => !canContain(nextKind, kind.kind));
    if (mismatchedChildKind) {
      res.status(400).json({ message: parentKindMessage(nextKind, mismatchedChildKind.kind) });
      return;
    }
  }

  const update = { ...input };
  if ('revision' in update && typeof update.revision === 'number') {
    const existing = await db.roadmap.findUnique({
      where: { id },
      select: { revision: true, ownerId: true },
    });
    if (!existing || existing.ownerId !== ownerId) throw notFound('Roadmap not found.');
    if (existing.revision !== update.revision) {
      res.status(409).json({ message: 'Conflict: roadmap was updated elsewhere.' });
      return;
    }
  }

  const updated = await db.roadmap.update({
    where: { id },
    data: definedEntries(update),
  });

  if (!updated || updated.ownerId !== ownerId) throw notFound('Roadmap not found.');
  res.json(toRoadmapDto(updated));
});

roadmapsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const children = await db.roadmap.count({
    where: { parentId: id, ownerId },
  });
  if (children > 0) {
    res.status(400).json({ message: 'Reparent or remove child roadmaps before deleting.' });
    return;
  }

  const existing = await db.roadmap.findUnique({
    where: { id },
  });
  if (!existing || existing.ownerId !== ownerId) throw notFound('Roadmap not found.');

  await db.roadmap.delete({
    where: { id },
  });

  res.status(204).end();
});

roadmapsRouter.get('/:id/steps', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const roadmap = await db.roadmap.findUnique({
    where: { id },
  });
  if (!roadmap || !isReadable(roadmap, optionalCallerId(res))) throw notFound('Roadmap not found.');
  const caller = optionalCallerId(res);

  const steps = await db.step.findMany({
    where: { roadmapId: id },
    orderBy: { order: 'asc' },
  });
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

  const roadmap = await db.roadmap.findUnique({
    where: { id },
  });
  if (!roadmap || roadmap.ownerId !== ownerId) throw notFound('Roadmap not found.');

  const count = await db.step.count({
    where: { roadmapId: id },
  });
  const step = await db.step.create({
    data: {
      ...input,
      ownerId,
      roadmapId: id,
      order: input.order ?? count,
    },
  });

  res.status(201).json(toStepDto(step));
});

roadmapsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const roadmap = await db.roadmap.findUnique({
    where: { id },
  });
  if (!roadmap || roadmap.ownerId !== ownerId) throw notFound('Roadmap not found.');

  const steps = await db.step.findMany({
    where: { roadmapId: id },
    select: { id: true },
  });
  const items = await db.progress.findMany({
    where: {
      ownerId,
      stepId: { in: steps.map((step) => step.id) },
    },
  });

  res.json({ items: items.map(toProgressDto) });
});
