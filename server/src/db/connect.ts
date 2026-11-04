import mongoose from 'mongoose';
import { env, hasDb } from '../config/env';
import { logger } from '../lib/logger';

let listenersAttached = false;
let connectPromise: Promise<void> | null = null;

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('error', (error) => {
    logger.error('database connection error', { message: error.message });
  });
  mongoose.connection.on('disconnected', () => {
    connectPromise = null;
    logger.warn('database disconnected');
  });
}

/**
 * Connect once per process. Serverless platforms reuse a process across
 * invocations, so a cached connection (or in-flight promise) avoids opening a
 * new pool for every request.
 */
export async function connectDb(): Promise<void> {
  if (!hasDb) {
    logger.warn('running without persistence', {
      detail: 'MONGODB_URI not set; API data routes answer 503.',
    });
    return;
  }

  attachListeners();
  mongoose.set('bufferCommands', false);

  if (mongoose.connection.readyState === 1) return;
  if (connectPromise) return connectPromise;

  connectPromise = mongoose
    .connect(env.MONGODB_URI as string, { serverSelectionTimeoutMS: 5_000 })
    .then(() => {
      logger.info('database connected', { database: mongoose.connection.name });
    })
    .catch((error: unknown) => {
      connectPromise = null;
      throw error;
    });

  return connectPromise;
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
}
