import { Router } from 'express';
import { badRequest, unavailable } from '../lib/api-error';
import { db } from '../models/index';
import { parseOrThrow } from '../lib/parse';
import { toFocusDto } from '../lib/dto';
import { callerId } from '../lib/scope';
import { requireAuth } from '../middleware/auth';
import { focusSchema } from '../validation/schemas';
import { hasDb } from '../config/env';

export const focusRouter = Router();

/** Focus is a per-owner singleton (ADR 0004): the hero and "continue where you left off". */
focusRouter.get('/', requireAuth, async (_req, res, next) => {
  if (!hasDb) {
    next(unavailable('Persistence is not configured on this server.'));
    return;
  }
  const ownerId = callerId(res);
  const focus = await db.focus.findFirst({
    where: { ownerId },
  });

  res.json(
    focus
      ? toFocusDto(focus)
      : {
          ownerId,
          visibility: 'private',
          items: [],
          updatedAt: new Date(0).toISOString(),
        },
  );
});

focusRouter.put('/', requireAuth, async (req, res, next) => {
  if (!hasDb) {
    next(unavailable('Persistence is not configured on this server.'));
    return;
  }
  const ownerId = callerId(res);
  const input = parseOrThrow(focusSchema, req.body);

  if ('items' in input && input.items) {
    if (new Set(input.items.map((item) => item.id)).size !== input.items.length) {
      throw badRequest('Focus row identifiers must be unique.');
    }
    if (input.items.filter((item) => item.highlighted).length > 2) {
      throw badRequest('At most two focus rows can be highlighted.');
    }
    if (input.items.length > 0 && !input.items.some((item) => item.highlighted)) {
      throw badRequest('At least one focus row must be highlighted.');
    }
    await Promise.all(
      input.items.map(async (item) => {
        if (item.kind === 'milestone') {
          const step = await db.step.findUnique({
            where: { id: item.targetId },
          });
          if (!step || step.ownerId !== ownerId) throw badRequest('Focus milestone must reference an owned step.');
          const parent = await db.roadmap.findUnique({
            where: { id: step.roadmapId },
          });
          if (!parent || parent.ownerId !== ownerId || parent.kind !== 'pipeline') {
            throw badRequest('Focus milestone must belong to an owned pipeline.');
          }
          return;
        }
        const expectedKind = item.kind === 'technology' ? 'tech' : 'pipeline';
        const roadmap = await db.roadmap.findUnique({
          where: { id: item.targetId },
        });
        if (
          !roadmap ||
          roadmap.ownerId !== ownerId ||
          roadmap.kind !== expectedKind
        ) {
          throw badRequest('Focus row must reference a matching owned roadmap.');
        }
      }),
    );
  }
  if ('weeklyFocus' in input && input.weeklyFocus) {
    if (new Set(input.weeklyFocus.map((item) => item.id)).size !== input.weeklyFocus.length) {
      throw badRequest('Weekly focus column identifiers must be unique.');
    }
    const highlightedCount = input.weeklyFocus.filter((item) => item.highlighted).length;
    if (highlightedCount > 2)
      throw badRequest('At most two weekly focus columns can be highlighted.');
    if (input.weeklyFocus.length > 0 && highlightedCount === 0) {
      throw badRequest('At least one weekly focus column must be highlighted.');
    }
  }

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
  if ('items' in input) {
    set.items = input.items ?? [];
    set.currentTechId = null;
    set.currentProjectId = null;
  }
  if ('weeklyFocus' in input) {
    set.weeklyFocus = input.weeklyFocus ?? [];
    set.weeklyFocusConfigured = true;
  }

  const focus = await db.focus.upsert({
    where: { ownerId },
    update: set,
    create: { ownerId, ...set },
  });

  res.json(toFocusDto(focus));
});
