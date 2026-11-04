import {
  pool,
  findMany,
  findUnique,
  findFirst,
  create,
  update,
  del,
  deleteMany,
  count,
  connectDb,
  disconnectDb,
} from '../lib/db';

export const db = { findMany, findUnique, findFirst, create, update, del, deleteMany, count };
export { pool, connectDb, disconnectDb };
