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
    const existing = await db.step.findUnique({
      where: { id },
      select: { revision: true, ownerId: true },
    });
    if (!existing || existing.ownerId !== ownerId) throw notFound('Step not found.');
    if (existing.revision !== input.revision) {
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

  const existing = await db.step.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!existing || existing.ownerId !== ownerId) throw notFound('Step not found.');

  const updated = await db.step.update({
    where: { id },
    data: changes,
  });

  res.json(toStepDto(updated));
});

stepsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const existing = await db.step.findUnique({
    where: { id },
  });
  if (!existing || existing.ownerId !== ownerId) throw notFound('Step not found.');

  await db.step.delete({
    where: { id },
  });
  await db.progress.deleteMany({ where: { stepId: id } });
  res.status(204).end();
});

stepsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const step = await db.step.findUnique({
    where: { id },
  });
  if (!step || step.ownerId !== ownerId) throw notFound('Step not found.');

  const progress = await db.progress.findFirst({
    where: { ownerId, stepId: id },
  });
  res.json(progress ? toProgressDto(progress) : null);
});

stepsRouter.put('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(progressSchema, req.body);
  const ownerId = callerId(res);

  const step = await db.step.findUnique({
    where: { id },
  });
  if (!step || step.ownerId !== ownerId) throw notFound('Step not found.');

  const done = input.done ?? input.status === 'done';
  const update: Record<string, unknown> = {
    done,
    completedAt: done ? new Date() : null,
  };
  if (input.status !== undefined) update.status = input.status;
  if (input.percent !== undefined) update.percent = input.percent;

  const existing = await db.progress.findFirst({
    where: { ownerId, stepId: id },
  });
  let progress;
  if (existing) {
    progress = await db.progress.update({
      where: { id: existing.id },
      data: update,
    });
  } else {
    progress = await db.progress.create({
      data: { ownerId, stepId: id, ...update },
    });
  }

  res.json(toProgressDto(progress));
});
