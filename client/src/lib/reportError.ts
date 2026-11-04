/**
 * Single funnel for unexpected client-side errors. Wire a telemetry sink here
 * once one exists; until then the structured console entry is the record of
 * truth for debugging production incidents.
 */
export function reportClientError(error: unknown, context: Record<string, unknown> = {}): void {
  const payload = { scope: 'client', ...context };
  console.error('[roadatlas] uncaught error', error, payload);
}
