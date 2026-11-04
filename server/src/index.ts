import { createApp } from './app';
import { env } from './config/env';
import { connectDb, disconnectDb } from './lib/db';
import { logger } from './lib/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  await connectDb();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info('server listening', { port: env.PORT, env: env.NODE_ENV });
  });

  let shuttingDown = false;
  const shutdown = (signal: string, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('shutdown requested', { signal, exitCode });

    const force = setTimeout(() => {
      logger.error('shutdown timed out; forcing exit');
      server.closeAllConnections();
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    force.unref();

    server.close(() => {
      void disconnectDb().finally(() => {
        logger.info('shutdown complete', { exitCode });
        process.exit(exitCode);
      });
    });
    server.closeIdleConnections();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    shutdown('unhandledRejection', 1);
  });

  process.on('uncaughtException', (error) => {
    logger.error('uncaught exception', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    shutdown('uncaughtException', 1);
  });
}

main().catch((error) => {
  logger.error('fatal startup error', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
