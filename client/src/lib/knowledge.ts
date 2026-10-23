import type { Note } from '@shared/index';

const SEED_STEP = /^(.+)-s\d+$/;

/** Where a note's attached target lives in the app. */
export function noteTargetHref(note: Note): string {
  switch (note.targetType) {
    case 'roadmap':
      return `/roadmaps/${note.targetId}`;
    case 'step':
      return `/roadmaps/${SEED_STEP.exec(note.targetId)?.[1] ?? ''}`;
    case 'tech':
      return '/compare';
    case 'decision':
      return '/decisions';
  }
}

export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
