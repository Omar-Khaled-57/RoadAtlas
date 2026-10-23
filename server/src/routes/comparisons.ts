import { Router } from 'express';
import { ComparisonModel } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { toComparisonDto } from '../lib/dto';
import { callerId, isReadable, optionalCallerId, scopeFilter } from '../lib/scope';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  createComparisonSchema,
  listQuerySchema,
  objectIdSchema,
  updateComparisonSchema,
} from '../validation/schemas';

export const comparisonsRouter = Router();

comparisonsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public' } = parseOrThrow(listQuerySchema, req.query);
  const filter = scopeFilter(scope, optionalCallerId(res));

  const docs = await ComparisonModel.find(filter).sort({ createdAt: 1 }).lean();
  res.json({ items: docs.map(toComparisonDto) });
});

comparisonsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await ComparisonModel.findById(id).lean();
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Comparison not found.');
  res.json(toComparisonDto(doc));
});

comparisonsRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createComparisonSchema, req.body);
  const ownerId = callerId(res);

  const comparison = await ComparisonModel.create({ ...input, ownerId });
  res.status(201).json(toComparisonDto(comparison.toObject()));
});

comparisonsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateComparisonSchema, req.body);
  const ownerId = callerId(res);

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const updated = await ComparisonModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) throw notFound('Comparison not found.');
  res.json(toComparisonDto(updated));
});

comparisonsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const deleted = await ComparisonModel.findOneAndDelete({ _id: id, ownerId });
  if (!deleted) throw notFound('Comparison not found.');
  res.status(204).end();
});
