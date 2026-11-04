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
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

/** True when pointing `childId` at `parentId` would close a parent chain cycle. */
async function createsParentCycle(childId: string, parentId: string): Promise<boolean> {
  let cursor: string | undefined = parentId;
  const seen = new Set<string>();
  while (cursor && !seen.has(cursor) && seen.size < 100) {
    if (cursor === childId) return true;
    seen.add(cursor);
    const node = await db.findUnique('Roadmap', cursor);
    cursor = (node as { parentId: string | null } | null)?.parentId ?? undefined;
  }
  return false;
}

roadmapsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public' } = parseOrThrow(listQuerySchema, req.query);
  const filter = scopeFilter(scope, optionalCallerId(res));
  const docs = await db.findMany('Roadmap', {
    where: filter,
    orderBy: { order: 'asc', createdAt: 'asc' },
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
  const doc = await db.findUnique('Roadmap', id);
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
    const parent = await db.findUnique('Roadmap', roadmapInput.parentId as string);
    if (!parent || (parent as { ownerId: string }).ownerId !== ownerId) {
      res.status(400).json({ message: 'Parent roadmap not found.' });
      return;
    }
    if (!canContain((parent as { kind: string }).kind, roadmapInput.kind)) {
      res.status(400).json({ message: parentKindMessage((parent as { kind: string }).kind, roadmapInput.kind) });
      return;
    }
  }

  const roadmap = await db.create('Roadmap', {
    ...roadmapInput,
    ownerId,
  });

  if (steps?.length) {
    for (const [index, step] of steps.entries()) {
      await db.create('Step', {
        ...step,
        ownerId,
        roadmapId: (roadmap as { id: string }).id,
        order: step.order ?? index,
      });
    }
  }

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
    const current = await db.findUnique('Roadmap', id);
    if (!current || (current as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');
    const parent = await db.findUnique('Roadmap', input.parentId as string);
    if (!parent || (parent as { ownerId: string }).ownerId !== ownerId) {
      res.status(400).json({ message: 'Parent roadmap not found.' });
      return;
    }
    if (await createsParentCycle(id, input.parentId as string)) {
      res.status(400).json({ message: 'Circular parent-child relationship.' });
      return;
    }
    const effectiveKind = input.kind ?? (current as { kind: string }).kind;
    if (!canContain((parent as { kind: string }).kind, effectiveKind)) {
      res.status(400).json({ message: parentKindMessage((parent as { kind: string }).kind, effectiveKind) });
      return;
    }
  }

  // A kind change must stay consistent with the existing parent and children too,
  // otherwise parentage becomes cross-kind through the back door.
  if (input.kind) {
    const nextKind = input.kind;
    const current = await db.findUnique('Roadmap', id);
    if (!current || (current as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');

    if (!('parentId' in input) && (current as { parentId: string | null }).parentId) {
      const parent = await db.findUnique('Roadmap', (current as { parentId: string }).parentId);
      if (parent && !canContain((parent as { kind: string }).kind, nextKind)) {
        res.status(400).json({ message: parentKindMessage((parent as { kind: string }).kind, nextKind) });
        return;
      }
    }

    const children = await db.findMany('Roadmap', {
      where: { parentId: id },
    });
    const mismatchedChildKind = children.find(
      (c) => !canContain(nextKind, (c as { kind: string }).kind),
    );
    if (mismatchedChildKind) {
      res.status(400).json({ message: parentKindMessage(nextKind, (mismatchedChildKind as { kind: string }).kind) });
      return;
    }
  }

  const update = { ...input };
  if ('revision' in update && typeof update.revision === 'number') {
    const existing = await db.findUnique('Roadmap', id);
    if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');
    if ((existing as { revision: number }).revision !== update.revision) {
      res.status(409).json({ message: 'Conflict: roadmap was updated elsewhere.' });
      return;
    }
  }

  const changes = definedEntries(update);
  const updated = await db.update('Roadmap', id, changes);

  if (!updated || (updated as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');
  res.json(toRoadmapDto(updated));
});

roadmapsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const children = await db.count('Roadmap', { parentId: id, ownerId });
  if (children > 0) {
    res.status(400).json({ message: 'Reparent or remove child roadmaps before deleting.' });
    return;
  }

  const existing = await db.findUnique('Roadmap', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');

  await db.del('Roadmap', id);

  res.status(204).end();
});

roadmapsRouter.get('/:id/steps', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const roadmap = await db.findUnique('Roadmap', id);
  if (!roadmap || !isReadable(roadmap, optionalCallerId(res))) throw notFound('Roadmap not found.');
  const caller = optionalCallerId(res);

  const steps = await db.findMany('Step', {
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

  const roadmap = await db.findUnique('Roadmap', id);
  if (!roadmap || (roadmap as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');

  const count = await db.count('Step', { roadmapId: id });
  const step = await db.create('Step', {
    ...input,
    ownerId,
    roadmapId: id,
    order: input.order ?? count,
  });

  res.status(201).json(toStepDto(step));
});

roadmapsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const roadmap = await db.findUnique('Roadmap', id);
  if (!roadmap || (roadmap as { ownerId: string }).ownerId !== ownerId) throw notFound('Roadmap not found.');

  const steps = await db.findMany('Step', {
    where: { roadmapId: id },
  });
  const stepIds = new Set((steps as { id: string }[]).map((step) => step.id));
  const allProgress = await db.findMany('Progress', { where: { ownerId } });
  const items = (allProgress as { stepId: string }[]).filter((p) => stepIds.has(p.stepId));

  res.json({ items: items.map(toProgressDto) });
});
