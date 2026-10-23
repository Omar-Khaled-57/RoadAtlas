import { Router } from 'express';
import { ProgressModel, StepModel } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { toProgressDto, toStepDto } from '../lib/dto';
import { callerId } from '../lib/scope';
import { requireAuth } from '../middleware/auth';
import { objectIdSchema, progressSchema, updateStepSchema } from '../validation/schemas';

export const stepsRouter = Router();

stepsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateStepSchema, req.body);
  const ownerId = callerId(res);

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const updated = await StepModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) throw notFound('Step not found.');
  res.json(toStepDto(updated));
});

stepsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const deleted = await StepModel.findOneAndDelete({ _id: id, ownerId });
  if (!deleted) throw notFound('Step not found.');

  await ProgressModel.deleteMany({ ownerId, stepId: id });
  res.status(204).end();
});

stepsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const step = await StepModel.findOne({ _id: id, ownerId }).lean();
  if (!step) throw notFound('Step not found.');

  const progress = await ProgressModel.findOne({ ownerId, stepId: id }).lean();
  res.json(progress ? toProgressDto(progress) : null);
});

stepsRouter.put('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const { done } = parseOrThrow(progressSchema, req.body);
  const ownerId = callerId(res);

  const step = await StepModel.findOne({ _id: id, ownerId }).lean();
  if (!step) throw notFound('Step not found.');

  const progress = await ProgressModel.findOneAndUpdate(
    { ownerId, stepId: id },
    { $set: { done, completedAt: done ? new Date() : null } },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  res.json(toProgressDto(progress));
});
