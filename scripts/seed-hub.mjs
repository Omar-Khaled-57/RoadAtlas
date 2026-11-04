#!/usr/bin/env node
/**
 * Seeds the hub roadmap and its child tech roadmaps into the database.
 * Reads from `scripts/hub-content.json` and upserts by `legacyKey`.
 *
 *   DATABASE_URL='...' node scripts/seed-hub.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../server/src/lib/db';

const here = path.dirname(fileURLToPath(import.meta.url));
const content = JSON.parse(fs.readFileSync(path.join(here, 'hub-content.json'), 'utf8'));

async function main() {
  const hub = await db.roadmap.upsert({
    where: { legacyKey: content.hub.key },
    update: {
      kind: 'hub',
      title: content.hub.title,
      description: content.hub.description,
      parentId: null,
      order: content.hub.order ?? 0,
      visibility: 'public',
    },
    create: {
      legacyKey: content.hub.key,
      kind: 'hub',
      title: content.hub.title,
      description: content.hub.description,
      parentId: null,
      order: content.hub.order ?? 0,
      visibility: 'public',
    },
  });
  console.log(`hub    ${hub.title.en} (${hub.id})`);

  for (const [index, child] of content.children.entries()) {
    const doc = await db.roadmap.upsert({
      where: { legacyKey: child.key },
      update: {
        kind: 'tech',
        title: child.title,
        description: child.description,
        parentId: hub.id,
        techId: child.techId ?? null,
        order: index,
        visibility: 'public',
      },
      create: {
        legacyKey: child.key,
        kind: 'tech',
        title: child.title,
        description: child.description,
        parentId: hub.id,
        techId: child.techId ?? null,
        order: index,
        visibility: 'public',
      },
    });
    console.log(`child  ${doc.title.en} (${doc.id})`);
  }

  console.log(`\n${content.children.length} children under "${hub.title.en}".`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
