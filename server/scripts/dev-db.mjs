import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Development database. Starts an ephemeral MongoDB on a fixed port so the API can
 * run locally without a system-wide install:
 *
 *   npm run db:dev -w server
 *   # then set MONGODB_URI=mongodb://127.0.0.1:27017/roadatlas in server/.env
 *
 * The data is in-memory and disappears when the process stops — it is a
 * development convenience, not a production store.
 */
const mongod = await MongoMemoryServer.create({
  instance: { port: 27017, dbName: 'roadatlas' },
});

console.log(`[db] development MongoDB listening on ${mongod.getUri()}`);

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};

process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
