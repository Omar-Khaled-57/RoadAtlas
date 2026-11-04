import { Router } from 'express';
import { db } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { redactPublic, toMetricDto } from '../lib/dto';
import { callerId, isReadable, optionalCallerId, scopeFilter } from '../lib/scope';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  createMetricSchema,
  listQuerySchema,
  objectIdSchema,
  updateMetricSchema,
} from '../validation/schemas';

export const metricsRouter = Router();

metricsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public', techId } = parseOrThrow(listQuerySchema, req.query);
  const filter: Record<string, unknown> = scopeFilter(scope, optionalCallerId(res));
  const caller = optionalCallerId(res);
  if (techId) filter.techId = techId;

  const docs = await db.findMany('Metric', {
    where: filter,
    orderBy: { createdAt: 'asc' },
  });
  const items = docs.map((doc) => {
    const dto = toMetricDto(doc) as unknown as Record<string, unknown>;
    if (!caller) {
      const rest = redactPublic(dto);
      return rest;
    }
    return dto;
  });
  res.json({ items });
});

metricsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await db.findUnique('Metric', id);
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Metric not found.');
  const dto = toMetricDto(doc) as unknown as Record<string, unknown>;
  if (doc.visibility === 'public' && !optionalCallerId(res)) {
    const rest = redactPublic(dto);
    res.json(rest);
    return;
  }
  res.json(dto);
});

metricsRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createMetricSchema, req.body);
  const ownerId = callerId(res);

  const metric = await db.create('Metric', { ...input, ownerId });
  res.status(201).json(toMetricDto(metric));
});

metricsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateMetricSchema, req.body);
  const ownerId = callerId(res);

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const existing = await db.findUnique('Metric', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Metric not found.');

  const updated = await db.update('Metric', id, changes);

  res.json(toMetricDto(updated));
});

metricsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const existing = await db.findUnique('Metric', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Metric not found.');

  await db.del('Metric', id);
  res.status(204).end();
});
