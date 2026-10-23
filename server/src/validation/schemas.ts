import { z } from 'zod';

/**
 * Request contracts for the API boundary. Bodies are strict so unknown keys are
 * rejected instead of being written to the database (no mass assignment).
 */

export const localizedStringSchema = z.strictObject({
  en: z.string().trim().min(1).max(300),
  ar: z.string().trim().min(1).max(300).optional(),
});

export const linkSchema = z.strictObject({
  label: z.string().trim().min(1).max(120),
  url: z.url().max(500),
});

export const visibilitySchema = z.enum(['public', 'private']);
export const roadmapKindSchema = z.enum(['hub', 'tech', 'pipeline']);
export const pipelineStageSchema = z.enum(['idea', 'design', 'build', 'ship', 'done']);
export const noteTargetTypeSchema = z.enum(['roadmap', 'step', 'tech', 'decision']);

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

export const listQuerySchema = z.object({
  scope: z.enum(['public', 'owner']).optional(),
  targetType: noteTargetTypeSchema.optional(),
  targetId: z.string().trim().min(1).max(120).optional(),
  techId: z.string().trim().min(1).max(80).optional(),
});

const stepInputSchema = z.strictObject({
  title: localizedStringSchema,
  description: localizedStringSchema.optional(),
  stage: pipelineStageSchema.optional(),
  resources: z.array(linkSchema).max(20).optional(),
  order: z.number().int().min(0).max(9999).optional(),
});

export const createStepSchema = stepInputSchema;

export const updateStepSchema = stepInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const createRoadmapSchema = z.strictObject({
  title: localizedStringSchema,
  description: localizedStringSchema.optional(),
  kind: roadmapKindSchema,
  visibility: visibilitySchema.optional(),
  parentId: objectIdSchema.optional(),
  techId: z.string().trim().min(1).max(80).optional(),
  order: z.number().int().min(0).max(9999).optional(),
  steps: z.array(stepInputSchema).max(50).optional(),
});

export const updateRoadmapSchema = createRoadmapSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const progressSchema = z.strictObject({
  done: z.boolean(),
});

const criterionScoreSchema = z.strictObject({
  value: z.number().finite(),
  note: localizedStringSchema.optional(),
});

const criterionSchema = z.strictObject({
  id: z.string().trim().min(1).max(80).optional(),
  name: localizedStringSchema,
  weight: z.number().min(0).max(1),
  scores: z.record(z.string().max(80), criterionScoreSchema),
});

export const createComparisonSchema = z.strictObject({
  title: localizedStringSchema,
  candidateTechIds: z.array(z.string().trim().min(1).max(80)).min(2).max(20),
  criteria: z.array(criterionSchema).max(50),
  conclusion: localizedStringSchema.optional(),
  visibility: visibilitySchema.optional(),
});

export const updateComparisonSchema = createComparisonSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const createMetricSchema = z.strictObject({
  techId: z.string().trim().min(1).max(80),
  key: z.string().trim().min(1).max(80),
  axis: z.strictObject({
    key: z.string().trim().min(1).max(80),
    label: localizedStringSchema,
    unit: z.string().trim().min(1).max(40).optional(),
  }),
  points: z
    .array(z.strictObject({ x: z.number().finite(), y: z.number().finite() }))
    .min(1)
    .max(500),
  finding: localizedStringSchema,
  visibility: visibilitySchema.optional(),
});

export const updateMetricSchema = createMetricSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const createNoteSchema = z.strictObject({
  targetType: noteTargetTypeSchema,
  targetId: z.string().trim().min(1).max(120),
  title: localizedStringSchema,
  content: localizedStringSchema,
  tags: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
  references: z.array(z.string().trim().min(1).max(300)).max(30).optional(),
  visibility: visibilitySchema.optional(),
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const createDecisionSchema = z.strictObject({
  context: localizedStringSchema,
  alternatives: z.array(localizedStringSchema).max(20).optional(),
  decision: localizedStringSchema,
  consequences: localizedStringSchema,
  revisitAt: z.iso.datetime().optional(),
  links: z.array(linkSchema).max(20).optional(),
  visibility: visibilitySchema.optional(),
});

export const updateDecisionSchema = createDecisionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const focusSchema = z.strictObject({
  currentTechId: z.string().trim().min(1).max(80).nullable().optional(),
  currentProjectId: objectIdSchema.nullable().optional(),
  lastVisited: z
    .strictObject({
      roadmapId: objectIdSchema,
      stepId: objectIdSchema.optional(),
      at: z.iso.datetime(),
    })
    .nullable()
    .optional(),
});
