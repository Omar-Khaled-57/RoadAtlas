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
  url: z
    .url()
    .refine((value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Only http and https URLs are allowed.')
    .max(500),
});

export const visibilitySchema = z.enum(['public', 'private']);
export const roadmapKindSchema = z.enum(['hub', 'tech', 'pipeline']);
export const pipelineStageSchema = z.enum(['idea', 'design', 'build', 'ship', 'done']);
export const noteTargetTypeSchema = z.enum(['roadmap', 'step', 'tech', 'decision']);

export const objectIdSchema = z.string().uuid('Invalid identifier.');

export const listQuerySchema = z.object({
  scope: z.enum(['public', 'owner']).optional(),
  targetType: noteTargetTypeSchema.optional(),
  targetId: z.string().trim().min(1).max(120).optional(),
  techId: z.string().trim().min(1).max(80).optional(),
  topics: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
});

const stepInputSchema = z.strictObject({
  title: localizedStringSchema,
  description: localizedStringSchema.optional(),
  stage: pipelineStageSchema.nullable().optional(),
  note: localizedStringSchema.optional(),
  resources: z.array(linkSchema).max(20).optional(),
  order: z.number().int().min(0).max(9999).optional(),
  revision: z.number().int().min(0).optional(),
  done: z.boolean().optional(),
  linkedRoadmapId: objectIdSchema.nullable().optional(),
  linkedStepId: objectIdSchema.nullable().optional(),
});

export const createStepSchema = stepInputSchema;

export const updateStepSchema = stepInputSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const createRoadmapSchema = z.strictObject({
  title: localizedStringSchema,
  description: localizedStringSchema.nullable().optional(),
  kind: roadmapKindSchema,
  visibility: visibilitySchema.optional(),
  parentId: objectIdSchema.nullable().optional(),
  techId: z.string().trim().min(1).max(80).nullable().optional(),
  order: z.number().int().min(0).max(9999).optional(),
  prerequisites: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  topics: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  steps: z.array(stepInputSchema).max(50).optional(),
  paused: z.boolean().optional(),
  status: z.enum(['planned', 'in_progress', 'finished', 'paused']).optional(),
  icon: z.string().trim().max(80).optional(),
  image: z.string().trim().max(500).url().optional(),
  revision: z.number().int().min(0).optional(),
});

export const updateRoadmapSchema = createRoadmapSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const progressSchema = z.strictObject({
  done: z.boolean().optional(),
  status: z
    .enum(['not_started', 'in_progress', 'partially_done', 'done', 'revisit', 'test', 'revise'])
    .optional(),
  percent: z.number().min(0).max(100).optional(),
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
  revision: z.number().int().min(0).optional(),
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
  revision: z.number().int().min(0).optional(),
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
  revision: z.number().int().min(0).optional(),
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
  revision: z.number().int().min(0).optional(),
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
  items: z
    .array(
      z.strictObject({
        id: z.string().trim().min(1).max(80),
        kind: z.enum(['technology', 'project', 'milestone']),
        targetId: objectIdSchema,
        highlighted: z.boolean(),
      }),
    )
    .max(20)
    .optional(),
  weeklyFocus: z
    .array(
      z.strictObject({
        id: z.string().trim().min(1).max(80),
        title: localizedStringSchema,
        highlighted: z.boolean(),
      }),
    )
    .max(12)
    .optional(),
});
