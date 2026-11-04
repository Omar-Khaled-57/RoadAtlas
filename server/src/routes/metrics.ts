import { Router } from 'express';
import { MetricModel } from '../models/index';
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

  const docs = await MetricModel.find(filter).sort({ createdAt: 1 }).lean();
  const items = docs.map((doc) => {
    const dto = toMetricDto(doc) as unknown as Record<string, unknown>;
    // Only anonymous readers lose `ownerId`; signed-in callers need it to detect
    // their own public records (ownership checks and edit affordances).
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
  const doc = await MetricModel.findById(id).lean();
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

  const metric = await MetricModel.create({ ...input, ownerId });
  res.status(201).json(toMetricDto(metric.toObject()));
});

metricsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateMetricSchema, req.body);
  const ownerId = callerId(res);

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const updated = await MetricModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) throw notFound('Metric not found.');
  res.json(toMetricDto(updated));
});

metricsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const deleted = await MetricModel.findOneAndDelete({ _id: id, ownerId });
  if (!deleted) throw notFound('Metric not found.');
  res.status(204).end();
});
