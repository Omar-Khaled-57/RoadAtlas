#!/usr/bin/env node
/**
 * Provisions the single RoadAtlas owner account.
 *
 * Usage: npm run user:create -w server -- --email owner@example.com
 *
 * Supply the password through USER_PASSWORD (deployment secret) or the hidden
 * prompt. Command-line password arguments are intentionally rejected.
 */
import 'dotenv/config';
import process from 'node:process';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function promptHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    rl._writeToOutput = (text) => {
      if (text.includes(query)) rl.output.write(query);
    };
    rl.question(query, (answer) => {
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

if (process.argv.includes('--password')) {
  fail('Command-line passwords are not accepted. Use USER_PASSWORD or the hidden prompt.');
}

const uri = process.env.MONGODB_URI;
const email = (arg('email') ?? process.env.USER_EMAIL ?? '').trim().toLowerCase();
const displayName = (arg('display-name') ?? process.env.USER_DISPLAY_NAME ?? '').trim();

if (!uri) fail('MONGODB_URI is not set.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Pass a valid --email.');

let password = process.env.USER_PASSWORD ?? '';
if (!password) {
  if (!process.stdin.isTTY) {
    fail('Set USER_PASSWORD or run this command in an interactive terminal.');
  }
  password = await promptHidden('Owner password (hidden): ');
}
if (password.length < 8) fail('The owner password must be at least 8 characters.');

const passwordHash = bcrypt.hashSync(password, 12);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true, default: undefined },
    sessionVersion: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

try {
  await mongoose.connect(uri);
  const owner = await User.findOne().select('_id').lean();
  if (owner) fail('An owner account already exists. RoadAtlas supports exactly one account.');

  const created = await User.create({
    email,
    passwordHash,
    ...(displayName ? { displayName } : {}),
  });
  console.log(`created owner ${created.email} (${created._id})`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await mongoose.disconnect();
}
