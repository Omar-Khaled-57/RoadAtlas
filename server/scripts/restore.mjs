#!/usr/bin/env node
/**
 * Restores a backup produced by backup.mjs.
 *
 * Usage: npm run restore -w server -- --file backups/roadatlas.json [--drop] [--yes]
 * Without --drop documents are upserted by _id; --drop empties each collection first
 * and therefore requires --yes.
 */
import 'dotenv/config';
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import { EJSON } from 'bson';
import mongoose from 'mongoose';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}
const has = (name) => process.argv.includes(`--${name}`);

const uri = process.env.MONGODB_URI;
const file = arg('file');
if (!uri) {
  console.error('error: MONGODB_URI is not set.');
  process.exit(1);
}
if (!file) {
  console.error('error: pass --file <backup.json>.');
  process.exit(1);
}
if (has('drop') && !has('yes')) {
  console.error('error: --drop deletes existing documents; re-run with --yes to confirm.');
  process.exit(1);
}

try {
  const payload = EJSON.parse(await readFile(file, 'utf8'), { relaxed: false });
  if (payload?.format !== 'roadatlas-ejson' || Number(payload.version) !== 1) {
    throw new Error('Not a RoadAtlas EJSON backup (format/version mismatch).');
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const summary = {};

  for (const [name, docs] of Object.entries(payload.collections)) {
    if (!Array.isArray(docs)) throw new Error(`Collection ${name} is not an array.`);
    // --drop must also empty collections that were empty in the backup, otherwise
    // documents created after the backup would survive the restore.
    if (has('drop')) await db.collection(name).deleteMany({});
    if (docs.length === 0) {
      summary[name] = 0;
      continue;
    }
    await db.collection(name).bulkWrite(
      docs.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
      })),
      { ordered: false },
    );
    summary[name] = docs.length;
  }

  console.log(JSON.stringify({ restored: summary, dropped: has('drop') }, null, 2));
} catch (error) {
  console.error('error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
