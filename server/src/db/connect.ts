import mongoose from 'mongoose';
import { env, hasDb } from '../config/env';
import { logger } from '../lib/logger';

export async function connectDb(): Promise<void> {
  if (!hasDb) {
    logger.warn('running without persistence', {
      detail: 'MONGODB_URI not set; API data routes answer 503.',
    });
    return;
  }

  mongoose.connection.on('error', (error) => {
    logger.error('database connection error', { message: error.message });
  });
  mongoose.connection.on('disconnected', () => logger.warn('database disconnected'));

  await mongoose.connect(env.MONGODB_URI as string);
  logger.info('database connected', { database: mongoose.connection.name });
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
}
