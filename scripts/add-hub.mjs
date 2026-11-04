#!/usr/bin/env node
/**
 * Adds the hub roadmap described in `dev/hub-content.json` plus its child tech
 * roadmaps, to the database behind MONGODB_URI (falls back to `server/.env`).
 *
 *   node dev/add-hub.mjs
 *
 * Documents are matched by `legacyKey`, so re-running after editing the JSON
 * updates the same nodes instead of duplicating them. That is the "bit by bit"
 * path: add an entry, re-run, refresh `/map`.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');

function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue;
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) out[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

const fileEnv = readEnvFile(path.join(repoRoot, 'server/.env'));
const uri = process.env.MONGODB_URI ?? fileEnv.MONGODB_URI;

if (!uri) {
  console.error('error: MONGODB_URI is not set (checked the environment and server/.env).');
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync(path.join(here, 'hub-content.json'), 'utf8'));

const localized = { en: { type: String, required: true }, ar: { type: String } };

const Roadmap = mongoose.model(
  'Roadmap',
  new mongoose.Schema(
    {
      ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
      visibility: { type: String, enum: ['public', 'private'], required: true },
      kind: { type: String, enum: ['hub', 'tech', 'pipeline'], required: true },
      title: localized,
      description: localized,
      parentId: { type: mongoose.Schema.Types.ObjectId, default: null },
      techId: { type: String, default: null },
      order: { type: Number, required: true, default: 0 },
      legacyKey: { type: String },
      prerequisites: { type: [String], default: [] },
      topics: { type: [String], default: [] },
      paused: { type: Boolean, default: false },
      revision: { type: Number, required: true, default: 0 },
    },
    { timestamps: true },
  ),
);

/** Upserts one roadmap by `legacyKey` and returns the stored document. */
async function write(filter, fields) {
  return Roadmap.findOneAndUpdate(
    filter,
    { $set: { visibility: 'public', ...fields }, $setOnInsert: { revision: 0 } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8_000 });

  const owners = await mongoose.connection.db.collection('users').find({}).limit(2).toArray();
  if (owners.length !== 1) {
    throw new Error(`expected exactly one owner account, found ${owners.length}`);
  }
  const ownerId = owners[0]._id;

  const hub = await write(
    { ownerId, legacyKey: content.hub.key },
    {
      ownerId,
      kind: 'hub',
      title: content.hub.title,
      description: content.hub.description,
      parentId: null,
      order: content.hub.order ?? 0,
    },
  );
  console.log(`hub    ${hub.title.en} (${hub._id})`);

  for (const [index, child] of content.children.entries()) {
    const doc = await write(
      { ownerId, legacyKey: child.key },
      {
        ownerId,
        kind: 'tech',
        title: child.title,
        description: child.description,
        parentId: hub._id,
        techId: child.techId ?? null,
        order: index,
      },
    );
    console.log(`child  ${doc.title.en} (${doc._id})`);
  }

  console.log(`\n${content.children.length} children under "${hub.title.en}".`);
} catch (error) {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
