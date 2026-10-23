import { afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Test bootstrap. Runs before the server modules are imported, so the environment
 * and the database are in place before `config/env` reads `process.env`.
 */

process.env.NODE_ENV = 'test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.JWT_SECRET = 'test-secret-value-that-is-long-enough-32';
process.env.ADMIN_EMAIL = 'owner@example.com';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-horse-battery-staple', 10);
// Keep test output readable; failures still log at warn/error.
process.env.LOG_LEVEL = 'warn';

const globals = globalThis as typeof globalThis & { __roadAtlasMongo?: MongoMemoryServer };

if (!globals.__roadAtlasMongo) {
  const mongod = await MongoMemoryServer.create({ instance: { dbName: 'roadatlas-test' } });
  globals.__roadAtlasMongo = mongod;
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
}

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await globals.__roadAtlasMongo?.stop();
  globals.__roadAtlasMongo = undefined;
});
