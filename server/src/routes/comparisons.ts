import { Router } from 'express';
import { ComparisonModel } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { redactPublic, toComparisonDto } from '../lib/dto';
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
  const caller = optionalCallerId(res);

  const docs = await ComparisonModel.find(filter).sort({ createdAt: 1 }).lean();
  const items = docs.map((doc) => {
    const dto = toComparisonDto(doc) as unknown as Record<string, unknown>;
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

comparisonsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await ComparisonModel.findById(id).lean();
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Comparison not found.');
  const dto = toComparisonDto(doc) as unknown as Record<string, unknown>;
  if (doc.visibility === 'public' && !optionalCallerId(res)) {
    const rest = redactPublic(dto);
    res.json(rest);
    return;
  }
  res.json(dto);
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
