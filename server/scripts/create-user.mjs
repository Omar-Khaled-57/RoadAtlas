#!/usr/bin/env node
/**
 * Provisions a user in the configured MongoDB.
 *
 * Usage: npm run user:create -w server -- --email owner@example.com [--password secret]
 * Without --password the value is read from USER_PASSWORD (never echoed).
 */
import 'dotenv/config';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const uri = process.env.MONGODB_URI;
const email = (arg('email') ?? process.env.USER_EMAIL ?? '').trim().toLowerCase();
const password = arg('password') ?? process.env.USER_PASSWORD ?? '';
const displayName = (arg('display-name') ?? process.env.USER_DISPLAY_NAME ?? '').trim();

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (!uri) fail('MONGODB_URI is not set.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Pass a valid --email.');
if (password.length < 12) fail('Pass a --password (or USER_PASSWORD) of at least 12 characters.');

const passwordHash = bcrypt.hashSync(password, 12);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);

try {
  await mongoose.connect(uri);
  const existing = await User.findOne({ email }).lean();
  if (existing) fail(`A user with ${email} already exists (${existing._id}).`);

  const created = await User.create({
    email,
    passwordHash,
    ...(displayName ? { displayName } : {}),
  });
  console.log(`created user ${created.email} (${created._id})`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await mongoose.disconnect();
}
