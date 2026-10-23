import { Router } from 'express';
import { ProgressModel, RoadmapModel, StepModel } from '../models/index';
import { notFound } from '../lib/api-error';
import { parseOrThrow } from '../lib/parse';
import { toProgressDto, toRoadmapDto, toStepDto } from '../lib/dto';
import { callerId, isReadable, optionalCallerId, scopeFilter } from '../lib/scope';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  createRoadmapSchema,
  createStepSchema,
  listQuerySchema,
  objectIdSchema,
  updateRoadmapSchema,
} from '../validation/schemas';

export const roadmapsRouter = Router();

/** Remove `undefined` entries so a partial update never clears a field by accident. */
function definedEntries(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

roadmapsRouter.get('/', optionalAuth, async (req, res) => {
  const { scope = 'public' } = parseOrThrow(listQuerySchema, req.query);
  const filter = scopeFilter(scope, optionalCallerId(res));
  const docs = await RoadmapModel.find(filter).sort({ order: 1, createdAt: 1 }).lean();
  res.json({ items: docs.map(toRoadmapDto) });
});

roadmapsRouter.get('/:id', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const doc = await RoadmapModel.findById(id).lean();
  if (!doc || !isReadable(doc, optionalCallerId(res))) throw notFound('Roadmap not found.');
  res.json(toRoadmapDto(doc));
});

roadmapsRouter.post('/', requireAuth, async (req, res) => {
  const input = parseOrThrow(createRoadmapSchema, req.body);
  const ownerId = callerId(res);
  const { steps, ...roadmapInput } = input;

  const roadmap = await RoadmapModel.create({ ...roadmapInput, ownerId });
  if (steps?.length) {
    await StepModel.insertMany(
      steps.map((step, index) => ({
        ...step,
        ownerId,
        roadmapId: roadmap._id,
        order: step.order ?? index,
      })),
    );
  }

  const created = await RoadmapModel.findById(roadmap._id).lean();
  res.status(201).json(toRoadmapDto(created));
});

roadmapsRouter.patch('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(updateRoadmapSchema, req.body);
  const ownerId = callerId(res);

  const updated = await RoadmapModel.findOneAndUpdate(
    { _id: id, ownerId },
    { $set: definedEntries(input) },
    { returnDocument: 'after', runValidators: true },
  ).lean();

  if (!updated) throw notFound('Roadmap not found.');
  res.json(toRoadmapDto(updated));
});

roadmapsRouter.delete('/:id', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const deleted = await RoadmapModel.findOneAndDelete({ _id: id, ownerId });
  if (!deleted) throw notFound('Roadmap not found.');

  const steps = await StepModel.find({ roadmapId: id, ownerId }).select('_id').lean();
  await StepModel.deleteMany({ roadmapId: id, ownerId });
  await ProgressModel.deleteMany({ ownerId, stepId: { $in: steps.map((step) => step._id) } });

  res.status(204).end();
});

roadmapsRouter.get('/:id/steps', optionalAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const roadmap = await RoadmapModel.findById(id).lean();
  if (!roadmap || !isReadable(roadmap, optionalCallerId(res))) throw notFound('Roadmap not found.');

  const steps = await StepModel.find({ roadmapId: id }).sort({ order: 1 }).lean();
  res.json({ items: steps.map(toStepDto) });
});

roadmapsRouter.post('/:id/steps', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const input = parseOrThrow(createStepSchema, req.body);
  const ownerId = callerId(res);

  const roadmap = await RoadmapModel.findOne({ _id: id, ownerId });
  if (!roadmap) throw notFound('Roadmap not found.');

  const count = await StepModel.countDocuments({ roadmapId: id });
  const step = await StepModel.create({
    ...input,
    ownerId,
    roadmapId: id,
    order: input.order ?? count,
  });

  res.status(201).json(toStepDto(step.toObject()));
});

roadmapsRouter.get('/:id/progress', requireAuth, async (req, res) => {
  const id = parseOrThrow(objectIdSchema, req.params.id);
  const ownerId = callerId(res);

  const roadmap = await RoadmapModel.findOne({ _id: id, ownerId });
  if (!roadmap) throw notFound('Roadmap not found.');

  const steps = await StepModel.find({ roadmapId: id, ownerId }).select('_id').lean();
  const items = await ProgressModel.find({
    ownerId,
    stepId: { $in: steps.map((step) => step._id) },
  }).lean();

  res.json({ items: items.map(toProgressDto) });
});
