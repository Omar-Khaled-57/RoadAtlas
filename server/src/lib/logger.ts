import { env } from '../config/env';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
export type LogLevel = keyof typeof LEVELS;

const threshold = LEVELS[env.LOG_LEVEL ?? (env.NODE_ENV === 'production' ? 'info' : 'debug')];

type Fields = Record<string, unknown>;

function write(level: LogLevel, message: string, fields?: Fields): void {
  if (LEVELS[level] < threshold) return;

  let line: string;
  try {
    line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields });
  } catch {
    line = JSON.stringify({ time: new Date().toISOString(), level, message });
  }

  const stream = LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout;
  try {
    stream.write(`${line}\n`);
  } catch {
    // Logging must never take the process down (for example a closed pipe).
  }
}

// A broken stdout/stderr (EPIPE) emits an 'error' event; without a listener Node
// would crash the process that is merely trying to write a log line.
for (const stream of [process.stdout, process.stderr]) {
  stream.on('error', () => {});
}

/** Minimal structured logger: one JSON object per line, no request bodies or secrets. */
export const logger = {
  debug: (message: string, fields?: Fields) => write('debug', message, fields),
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
};
