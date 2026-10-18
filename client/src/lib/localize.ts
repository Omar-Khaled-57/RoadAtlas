import type { LocalizedString } from '@shared/index';

/**
 * Resolve a domain `LocalizedString` for the active language. Arabic falls back
 * to English when a translation is missing (see docs/decisions/0004).
 */
export function localize(value: LocalizedString | undefined, lang: string): string {
  if (!value) return '';
  return lang.startsWith('ar') && value.ar ? value.ar : value.en;
}
