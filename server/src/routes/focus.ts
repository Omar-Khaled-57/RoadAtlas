import { Router } from 'express';
import { FocusModel } from '../models/index';
import { parseOrThrow } from '../lib/parse';
import { toFocusDto } from '../lib/dto';
import { callerId } from '../lib/scope';
import { requireAuth } from '../middleware/auth';
import { focusSchema } from '../validation/schemas';

export const focusRouter = Router();

/** Focus is a per-owner singleton (ADR 0004): the hero and "continue where you left off". */
focusRouter.get('/', requireAuth, async (_req, res) => {
  const ownerId = callerId(res);
  const focus = await FocusModel.findOne({ ownerId }).lean();

  res.json(
    focus
      ? toFocusDto(focus)
      : {
          ownerId,
          visibility: 'private',
          updatedAt: new Date(0).toISOString(),
        },
  );
});

focusRouter.put('/', requireAuth, async (req, res) => {
  const ownerId = callerId(res);
  const input = parseOrThrow(focusSchema, req.body);

  // Only the fields the caller sent are touched, so recording a visit never
  // clears the current tech or project.
  const set: Record<string, unknown> = {};
  if ('currentTechId' in input) set.currentTechId = input.currentTechId ?? null;
  if ('currentProjectId' in input) set.currentProjectId = input.currentProjectId ?? null;
  if ('lastVisited' in input) {
    set.lastVisited = input.lastVisited
      ? {
          roadmapId: input.lastVisited.roadmapId,
          stepId: input.lastVisited.stepId ?? null,
          at: new Date(input.lastVisited.at),
        }
      : null;
  }

  const focus = await FocusModel.findOneAndUpdate(
    { ownerId },
    { $set: set },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  res.json(toFocusDto(focus));
});
