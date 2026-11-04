import { Router } from 'express';
import { db } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { redactPublic, toNoteDto } from '../lib/dto';
import { callerId, isReadable, optionalCallerId, scopeFilter } from '../lib/scope';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  createNoteSchema,
  listQuerySchema,
  objectIdSchema,
  updateNoteSchema,
} from '../validation/schemas';

export const notesRouter = Router();

notesRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public', targetType, targetId } = parseOrThrow(listQuerySchema, req.query);
  const filter: Record<string, unknown> = scopeFilter(scope, optionalCallerId(res));
  const caller = optionalCallerId(res);
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = targetId;

  const docs = await db.findMany('Note', {
    where: filter,
    orderBy: { createdAt: 'asc' },
  });
  const items = docs.map((doc) => {
    const dto = toNoteDto(doc) as unknown as Record<string, unknown>;
    if (!caller) {
      const rest = redactPublic(dto);
      return rest;
    }
    return dto;
  });
  res.json({ items });
});

notesRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await db.findUnique('Note', id);
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Note not found.');
  const dto = toNoteDto(doc) as unknown as Record<string, unknown>;
  if (doc.visibility === 'public' && !optionalCallerId(res)) {
    const rest = redactPublic(dto);
    res.json(rest);
    return;
  }
  res.json(dto);
});

notesRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createNoteSchema, req.body);
  const ownerId = callerId(res);

  const note = await db.create('Note', { ...input, ownerId });
  res.status(201).json(toNoteDto(note));
});

notesRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateNoteSchema, req.body);
  const ownerId = callerId(res);

  const existing = await db.findUnique('Note', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Note not found.');

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const updated = await db.update('Note', id, changes);

  res.json(toNoteDto(updated));
});

notesRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const existing = await db.findUnique('Note', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Note not found.');

  await db.del('Note', id);
  res.status(204).end();
});
