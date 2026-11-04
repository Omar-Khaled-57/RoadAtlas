import { Router } from 'express';
import { db } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { redactPublic, toDecisionDto } from '../lib/dto';
import { callerId, isReadable, optionalCallerId, scopeFilter } from '../lib/scope';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  createDecisionSchema,
  listQuerySchema,
  objectIdSchema,
  updateDecisionSchema,
} from '../validation/schemas';

export const decisionsRouter = Router();

decisionsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public' } = parseOrThrow(listQuerySchema, req.query);
  const filter = scopeFilter(scope, optionalCallerId(res));
  const caller = optionalCallerId(res);

  const docs = await db.findMany('Decision', {
    where: filter,
    orderBy: { createdAt: 'desc' },
  });
  const items = docs.map((doc) => {
    const dto = toDecisionDto(doc) as unknown as Record<string, unknown>;
    if (!caller) {
      const rest = redactPublic(dto);
      return rest;
    }
    return dto;
  });
  res.json({ items });
});

decisionsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await db.findUnique('Decision', id);
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Decision not found.');
  const dto = toDecisionDto(doc) as unknown as Record<string, unknown>;
  if (doc.visibility === 'public' && !optionalCallerId(res)) {
    const rest = redactPublic(dto);
    res.json(rest);
    return;
  }
  res.json(dto);
});

decisionsRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createDecisionSchema, req.body);
  const ownerId = callerId(res);

  const decision = await db.create('Decision', { ...input, ownerId });
  res.status(201).json(toDecisionDto(decision));
});

decisionsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateDecisionSchema, req.body);
  const ownerId = callerId(res);

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const existing = await db.findUnique('Decision', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Decision not found.');

  const updated = await db.update('Decision', id, changes);

  res.json(toDecisionDto(updated));
});

decisionsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const existing = await db.findUnique('Decision', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Decision not found.');

  await db.del('Decision', id);
  res.status(204).end();
});
