import mongoose from 'mongoose';
import { env, hasDb } from '../config/env';

export async function connectDb(): Promise<void> {
  if (!hasDb) {
    console.warn('[db] MONGODB_URI not set — skipping Mongo connection (Phase 1 stub).');
    return;
  }

  await mongoose.connect(env.MONGODB_URI as string);
  console.log('[db] connected to MongoDB');
}
