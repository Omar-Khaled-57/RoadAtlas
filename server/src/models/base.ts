import { Schema } from 'mongoose';

export const VISIBILITIES = ['public', 'private'] as const;
export const ROADMAP_KINDS = ['hub', 'tech', 'pipeline'] as const;
export const PIPELINE_STAGES = ['idea', 'design', 'build', 'ship', 'done'] as const;
export const NOTE_TARGET_TYPES = ['roadmap', 'step', 'tech', 'decision'] as const;

/** `{ en, ar? }` — Arabic falls back to English at render time (see ADR 0004). */
export const localizedStringSchema = new Schema(
  {
    en: { type: String, required: true, trim: true },
    ar: { type: String, trim: true, default: undefined },
  },
  { _id: false },
);

export const linkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

export const visibilityField = {
  type: String,
  enum: VISIBILITIES,
  required: true,
  default: 'private',
} as const;

export const ownerIdField = {
  type: Schema.Types.ObjectId,
  required: true,
  index: true,
} as const;
