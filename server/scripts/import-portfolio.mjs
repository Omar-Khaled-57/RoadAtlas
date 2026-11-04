#!/usr/bin/env node
/**
 * Imports a public portfolio project export into RoadAtlas as project roadmaps.
 * The input is the portfolio's own published `projects` rows, exported as JSON;
 * no project copy is embedded in the application bundle.
 *
 * Usage: node server/scripts/import-portfolio.mjs [--file /path/projects.json]
 * Without --file, published project records are fetched from ../my-portfolio/.env.
 * Requires MONGODB_URI and ADMIN_EMAIL in server/.env.
 */
import dotenv from 'dotenv';
import process from 'node:process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? undefined : process.argv[index + 1];
};
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(scriptDir, '../.env'), quiet: true });
const file = arg('file');
if (!process.env.MONGODB_URI || !process.env.ADMIN_EMAIL) {
  console.error('Configure MONGODB_URI and ADMIN_EMAIL in server/.env.');
  process.exit(1);
}

let input;
if (file) {
  input = JSON.parse(await readFile(file, 'utf8'));
} else {
  dotenv.config({ path: path.resolve(scriptDir, '../../../my-portfolio/.env'), quiet: true });
  const sourceUrl = process.env.VITE_SUPABASE_URL;
  const sourceKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!sourceUrl || !sourceKey) {
    console.error('Set portfolio Supabase credentials in ../my-portfolio/.env or pass --file.');
    process.exit(1);
  }
  const url = new URL('/rest/v1/projects', sourceUrl);
  url.search = new URLSearchParams({
    select: 'id,slug,title,title_ar,description,description_ar,img,tech_stack,features,link,github',
    is_published: 'eq.true',
    order: 'order_index.asc,created_at.desc',
  }).toString();
  const response = await fetch(url, {
    headers: { apikey: sourceKey, Authorization: `Bearer ${sourceKey}` },
  });
  if (!response.ok) throw new Error(`Portfolio source returned HTTP ${response.status}.`);
  input = await response.json();
}
if (!Array.isArray(input))
  throw new Error('Input must be an array of published portfolio projects.');
const required = ['title', 'description'];
for (const [index, row] of input.entries()) {
  if (!row || required.some((key) => typeof row[key] !== 'string' || !row[key].trim())) {
    throw new Error(`Project row ${index + 1} is missing a title or description.`);
  }
}

await mongoose.connect(process.env.MONGODB_URI);
try {
  const db = mongoose.connection.db;
  const owner = await db
    .collection('users')
    .findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
  if (!owner)
    throw new Error('Admin user not found; create the account before importing portfolio data.');

  let imported = 0;
  for (const [index, project] of input.entries()) {
    const sourceKey = String(project.id ?? project.slug ?? project.title).trim();
    const legacyKey = `portfolio-project-${sourceKey}`;
    const title = {
      en: project.title.trim(),
      ...(project.title_ar ? { ar: project.title_ar.trim() } : {}),
    };
    const description = {
      en: project.description.trim(),
      ...(project.description_ar ? { ar: project.description_ar.trim() } : {}),
    };
    const projectLinks = [project.link, project.github].filter(
      (url) => typeof url === 'string' && url,
    );
    const stack = Array.isArray(project.tech_stack) ? project.tech_stack.filter(Boolean) : [];
    const topics = [...new Set(stack)];
    const headings = Array.isArray(project.features) ? project.features.filter(Boolean) : [];
    const stepTitles = (headings.length ? headings : stack).slice(0, 12);
    const now = new Date();
    const result = await db.collection('roadmaps').findOneAndUpdate(
      { ownerId: owner._id, legacyKey },
      {
        $set: {
          ownerId: owner._id,
          visibility: 'public',
          kind: 'pipeline',
          title,
          description,
          parentId: null,
          techId: null,
          order: index,
          legacyKey,
          prerequisites: [],
          topics,
          paused: false,
          status: 'finished',
          icon: undefined,
          image: project.img || undefined,
          revision: 0,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: 'after' },
    );
    const roadmap = result.value ?? result;
    const oldSteps = await db
      .collection('steps')
      .find({ ownerId: owner._id, roadmapId: roadmap._id }, { projection: { _id: 1 } })
      .toArray();
    if (oldSteps.length) {
      await db.collection('progress').deleteMany({
        ownerId: owner._id,
        stepId: { $in: oldSteps.map(({ _id }) => _id) },
      });
      await db.collection('steps').deleteMany({ _id: { $in: oldSteps.map(({ _id }) => _id) } });
    }
    if (stepTitles.length) {
      const steps = stepTitles.map((step, stepIndex) => ({
        _id: new mongoose.Types.ObjectId(),
        ownerId: owner._id,
        roadmapId: roadmap._id,
        title: typeof step === 'string' ? { en: step } : step,
        description: undefined,
        resources: projectLinks.map((url) => ({ label: url, url })),
        order: stepIndex,
        legacyKey: undefined,
        stage: 'done',
        revision: 0,
        createdAt: now,
        updatedAt: now,
      }));
      await db.collection('steps').insertMany(steps);
      await db.collection('progress').bulkWrite(
        steps.map((step) => ({
          updateOne: {
            filter: { ownerId: owner._id, stepId: step._id },
            update: {
              $set: { ownerId: owner._id, stepId: step._id, done: true, completedAt: now },
            },
            upsert: true,
          },
        })),
      );
    }
    imported += 1;
  }

  // Official documentation links are stored alongside every comparison row;
  // numeric scores are explicitly framed as this portfolio's assessment.
  const tauri = 't-tauri';
  const electron = 't-electron';
  const comparisonTitle = { en: 'Tauri vs Electron for desktop projects' };
  const evidence = [
    { label: 'Tauri architecture', url: 'https://v2.tauri.app/concept/architecture/' },
    { label: 'Tauri security', url: 'https://v2.tauri.app/security/' },
    {
      label: 'Electron process model',
      url: 'https://www.electronjs.org/docs/latest/tutorial/process-model',
    },
    { label: 'Electron security', url: 'https://www.electronjs.org/docs/latest/tutorial/security' },
  ];
  const criterion = (id, name, weight, tauriValue, electronValue, tauriNote, electronNote) => ({
    id,
    name: { en: name },
    weight,
    scores: {
      [tauri]: { value: tauriValue, note: { en: tauriNote } },
      [electron]: { value: electronValue, note: { en: electronNote } },
    },
  });
  const comparison = {
    ownerId: owner._id,
    visibility: 'public',
    title: comparisonTitle,
    candidateTechIds: [tauri, electron],
    criteria: [
      criterion(
        'runtime-footprint',
        'Runtime footprint control',
        0.25,
        9,
        6,
        'Tauri uses the operating system webview; the score reflects less bundled browser runtime in this setup.',
        'Electron bundles Chromium and Node.js; the score reflects the larger packaged runtime.',
      ),
      criterion(
        'native-integration',
        'Native integration path',
        0.2,
        8,
        9,
        'Tauri commands and plugins provide the native boundary; project code uses Rust for system access.',
        'Electron main/preload processes expose Node.js and desktop APIs with a mature process model.',
      ),
      criterion(
        'web-stack-reuse',
        'Reuse of web frontend skills',
        0.2,
        8,
        9,
        'Tauri renders a web frontend and supports common web toolchains.',
        'Electron renders web content using Chromium and Node.js.',
      ),
      criterion(
        'security-boundary',
        'Security boundary clarity',
        0.2,
        8,
        7,
        'Tauri uses capabilities and permissions that can be scoped to application commands.',
        'Electron requires careful main/preload/renderer separation, sandboxing, and security configuration.',
      ),
      criterion(
        'ecosystem-fit',
        'Fit with current portfolio projects',
        0.15,
        9,
        8,
        'The portfolio includes Tauri projects such as Zenith and StoryBox3.',
        'The portfolio includes the Rias desktop whiteboard built with Electron.',
      ),
    ],
    conclusion: {
      en: 'For this portfolio, Tauri is the current fit for projects where a smaller system-facing desktop shell matters; Electron remains a strong fit when Chromium consistency and its Node.js desktop ecosystem matter more. Scores are an editorial, project-specific assessment, not benchmark results. Revisit after the next substantial desktop project.',
    },
    chosenTechId: tauri,
    revisitAt: null,
    evidence,
    revision: 0,
    updatedAt: new Date(),
  };
  await db
    .collection('comparisons')
    .updateOne(
      { ownerId: owner._id, 'title.en': comparisonTitle.en },
      { $set: comparison, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
  console.log(
    `Imported or refreshed ${imported} portfolio project roadmaps and one official-doc comparison.`,
  );
} finally {
  await mongoose.disconnect();
}
