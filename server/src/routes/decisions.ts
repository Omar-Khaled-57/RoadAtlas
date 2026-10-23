import { Router } from 'express';
import { DecisionModel } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { toDecisionDto } from '../lib/dto';
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

  const docs = await DecisionModel.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ items: docs.map(toDecisionDto) });
});

decisionsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await DecisionModel.findById(id).lean();
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Decision not found.');
  res.json(toDecisionDto(doc));
});

decisionsRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createDecisionSchema, req.body);
  const ownerId = callerId(res);

  const decision = await DecisionModel.create({ ...input, ownerId });
  res.status(201).json(toDecisionDto(decision.toObject()));
});

decisionsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateDecisionSchema, req.body);
  const ownerId = callerId(res);

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const updated = await DecisionModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) throw notFound('Decision not found.');
  res.json(toDecisionDto(updated));
});

decisionsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const deleted = await DecisionModel.findOneAndDelete({ _id: id, ownerId });
  if (!deleted) throw notFound('Decision not found.');
  res.status(204).end();
});
