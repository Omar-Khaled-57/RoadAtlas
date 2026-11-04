import { Router } from 'express';
import { db } from '../models/index';
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

  if ('revision' in input && typeof input.revision === 'number') {
    const existing = await db.findFirst('Step', { id });
    if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Step not found.');
    if ((existing as { revision: number }).revision !== input.revision) {
      res.status(409).json({ message: 'Conflict: step was updated elsewhere.' });
      return;
    }
  }

  const changes = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  if ('revision' in changes && typeof changes.revision === 'number') {
    changes.revision = (changes.revision ?? 0) + 1;
  }
  const updated = await db.update('Step', id, changes);

  if (!updated) throw notFound('Step not found.');
  res.json(toStepDto(updated));
});

stepsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const existing = await db.findUnique('Step', id);
  if (!existing || (existing as { ownerId: string }).ownerId !== ownerId) throw notFound('Step not found.');

  await db.del('Step', id);
  await db.deleteMany('Progress', { stepId: id });
  res.status(204).end();
});

stepsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const step = await db.findUnique('Step', id);
  if (!step || (step as { ownerId: string }).ownerId !== ownerId) throw notFound('Step not found.');

  const progress = await db.findFirst('Progress', { ownerId, stepId: id });
  res.json(progress ? toProgressDto(progress) : null);
});

stepsRouter.put('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(progressSchema, req.body);
  const ownerId = callerId(res);

  const step = await db.findUnique('Step', id);
  if (!step || (step as { ownerId: string }).ownerId !== ownerId) throw notFound('Step not found.');

  const done = input.done ?? input.status === 'done';
  const update: Record<string, unknown> = {
    done,
    completedAt: done ? new Date() : null,
  };
  if (input.status !== undefined) update.status = input.status;
  if (input.percent !== undefined) update.percent = input.percent;

  const existing = await db.findFirst('Progress', { ownerId, stepId: id });
  let progress;
  if (existing) {
    progress = await db.update('Progress', (existing as { id: string }).id, update);
  } else {
    progress = await db.create('Progress', { ownerId, stepId: id, ...update });
  }

  res.json(toProgressDto(progress));
});
