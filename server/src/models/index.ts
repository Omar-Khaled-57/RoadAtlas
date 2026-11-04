import { Schema, model } from 'mongoose';
import {
  linkSchema,
  localizedStringSchema,
  NOTE_TARGET_TYPES,
  ownerIdField,
  PIPELINE_STAGES,
  ROADMAP_KINDS,
  visibilityField,
} from './base';

/**
 * Persistence schemas for the domain model v2 (docs/decisions/0004-domain-model-v2.md).
 *
 * Ownership rules that the schema layer encodes:
 * - every user-owned collection carries `ownerId`; the server always derives it
 *   from the verified session, never from the request body;
 * - `visibility` defaults to `private`, so a record is never public by accident;
 * - catalogue references (`techId`, note targets) stay strings because the tech
 *   catalogue is not an owned collection — no second collection for a tiny concept.
 */

export const UserModel = model(
  'User',
  new Schema(
    {
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      displayName: { type: String, trim: true, default: undefined },
      sessionVersion: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);

export const RoadmapModel = model(
  'Roadmap',
  new Schema(
    {
      ownerId: ownerIdField,
      visibility: visibilityField,
      kind: { type: String, enum: ROADMAP_KINDS, required: true },
      title: { type: localizedStringSchema, required: true },
      description: { type: localizedStringSchema, default: undefined },
      parentId: { type: Schema.Types.ObjectId, default: null, index: true },
      techId: { type: String, default: null, trim: true },
      order: { type: Number, required: true, default: 0 },
      legacyKey: { type: String, trim: true, default: undefined },
      prerequisites: { type: [String], default: [] },
      topics: { type: [String], default: [] },
      paused: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['planned', 'in_progress', 'finished', 'paused'],
        default: undefined,
      },
      icon: { type: String, trim: true, default: undefined },
      image: { type: String, trim: true, default: undefined },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ).index(
    { ownerId: 1, legacyKey: 1 },
    { unique: true, partialFilterExpression: { legacyKey: { $type: 'string' } } },
  ),
);

export const StepModel = model(
  'Step',
  new Schema(
    {
      ownerId: ownerIdField,
      roadmapId: { type: Schema.Types.ObjectId, required: true, index: true },
      title: { type: localizedStringSchema, required: true },
      description: { type: localizedStringSchema, default: undefined },
      resources: { type: [linkSchema], default: [] },
      order: { type: Number, required: true, default: 0 },
      legacyKey: { type: String, trim: true, default: undefined },
      stage: { type: String, enum: PIPELINE_STAGES, default: null },
      note: { type: localizedStringSchema, default: undefined },
      done: { type: Boolean, default: undefined },
      revision: { type: Number, required: true, default: 0 },
      linkedRoadmapId: { type: Schema.Types.ObjectId, default: null },
      linkedStepId: { type: Schema.Types.ObjectId, default: null },
    },
    { timestamps: true },
  ).index(
    { ownerId: 1, legacyKey: 1 },
    { unique: true, partialFilterExpression: { legacyKey: { $type: 'string' } } },
  ),
);

export const ProgressModel = model(
  'Progress',
  new Schema(
    {
      ownerId: ownerIdField,
      stepId: { type: Schema.Types.ObjectId, required: true, index: true },
      done: { type: Boolean, required: true, default: false },
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'partially_done', 'done', 'revisit', 'test', 'revise'],
        default: undefined,
      },
      percent: { type: Number, min: 0, max: 100, default: undefined },
      completedAt: { type: Date, default: null },
    },
    { timestamps: true },
  ).index({ ownerId: 1, stepId: 1 }, { unique: true }),
);

const criterionScoreSchema = new Schema(
  {
    value: { type: Number, required: true },
    note: { type: localizedStringSchema, default: undefined },
  },
  { _id: false },
);

const criterionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    name: { type: localizedStringSchema, required: true },
    weight: { type: Number, required: true, min: 0, max: 1 },
    scores: { type: Map, of: criterionScoreSchema, default: {} },
  },
  { _id: false },
);

export const ComparisonModel = model(
  'Comparison',
  new Schema(
    {
      ownerId: ownerIdField,
      visibility: visibilityField,
      title: { type: localizedStringSchema, required: true },
      candidateTechIds: { type: [String], default: [] },
      criteria: { type: [criterionSchema], default: [] },
      conclusion: { type: localizedStringSchema, default: undefined },
      chosenTechId: { type: String, default: null, trim: true },
      revisitAt: { type: Date, default: null },
      evidence: { type: [linkSchema], default: [] },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);

export const MetricModel = model(
  'Metric',
  new Schema(
    {
      ownerId: ownerIdField,
      visibility: visibilityField,
      techId: { type: String, required: true, trim: true },
      key: { type: String, required: true, trim: true },
      axis: {
        key: { type: String, required: true, trim: true },
        label: { type: localizedStringSchema, required: true },
        unit: { type: String, trim: true, default: undefined },
      },
      points: {
        type: [
          new Schema(
            { x: { type: Number, required: true }, y: { type: Number, required: true } },
            { _id: false },
          ),
        ],
        default: [],
      },
      finding: { type: localizedStringSchema, required: true },
      evidence: { type: [linkSchema], default: [] },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);

export const NoteModel = model(
  'Note',
  new Schema(
    {
      ownerId: ownerIdField,
      visibility: visibilityField,
      targetType: { type: String, enum: NOTE_TARGET_TYPES, required: true },
      targetId: { type: String, required: true, trim: true, index: true },
      title: { type: localizedStringSchema, required: true },
      content: { type: localizedStringSchema, required: true },
      tags: { type: [String], default: [] },
      references: { type: [String], default: [] },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);

export const DecisionModel = model(
  'DecisionRecord',
  new Schema(
    {
      ownerId: ownerIdField,
      visibility: visibilityField,
      context: { type: localizedStringSchema, required: true },
      alternatives: { type: [localizedStringSchema], default: [] },
      decision: { type: localizedStringSchema, required: true },
      consequences: { type: localizedStringSchema, required: true },
      revisitAt: { type: Date, default: null },
      links: { type: [linkSchema], default: [] },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);

export const FocusModel = model(
  'Focus',
  new Schema(
    {
      ownerId: { type: Schema.Types.ObjectId, required: true, unique: true },
      visibility: visibilityField,
      currentTechId: { type: String, default: null, trim: true },
      currentProjectId: { type: Schema.Types.ObjectId, default: null },
      lastVisited: {
        roadmapId: { type: Schema.Types.ObjectId, default: null },
        stepId: { type: Schema.Types.ObjectId, default: null },
        at: { type: Date, default: null },
      },
      items: {
        type: [
          new Schema(
            {
              id: { type: String, required: true, trim: true },
              kind: { type: String, enum: ['technology', 'project', 'milestone'], required: true },
              targetId: { type: String, required: true, trim: true },
              highlighted: { type: Boolean, required: true, default: false },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
      weeklyFocus: {
        type: [
          new Schema(
            {
              id: { type: String, required: true, trim: true },
              title: { type: localizedStringSchema, required: true },
              highlighted: { type: Boolean, required: true, default: false },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
      weeklyFocusConfigured: { type: Boolean, default: false },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);
