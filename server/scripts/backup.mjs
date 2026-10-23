#!/usr/bin/env node
/**
 * Dumps every RoadAtlas collection to a single EJSON file.
 *
 * Usage: npm run backup -w server [-- --out backups/roadatlas.json]
 * Writes to backups/roadatlas-<timestamp>.json by default.
 */
import 'dotenv/config';
import process from 'node:process';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EJSON } from 'bson';
import mongoose from 'mongoose';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('error: MONGODB_URI is not set.');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = arg('out') ?? path.join('backups', `roadatlas-${stamp}.json`);

try {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = {};

  const infos = await db.listCollections().toArray();
  for (const info of infos) {
    if (info.name.startsWith('system.')) continue;
    collections[info.name] = await db.collection(info.name).find({}).toArray();
  }

  const payload = {
    format: 'roadatlas-ejson',
    version: 1,
    createdAt: new Date().toISOString(),
    database: mongoose.connection.name,
    counts: Object.fromEntries(Object.entries(collections).map(([k, v]) => [k, v.length])),
    collections,
  };

  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, EJSON.stringify(payload, { relaxed: false }), { mode: 0o600 });
  // `mode` only applies to new files; enforce it when overwriting a previous dump.
  await chmod(out, 0o600);
  console.log(JSON.stringify({ file: out, counts: payload.counts }, null, 2));
} catch (error) {
  console.error('error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
