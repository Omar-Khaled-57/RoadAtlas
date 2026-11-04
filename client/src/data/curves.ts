import type { LocalizedString } from '@shared/index';

/**
 * Curves data layer — server-only. All metrics are read from `/api/metrics`;
 * this file holds no seed data. Tech display names come from the tech catalogue.
 */

export interface CurveEvidence {
  url: string;
  label: LocalizedString;
}
