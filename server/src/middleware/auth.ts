import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env, hasDb } from '../config/env';
import { db } from '../models/index';

export const SESSION_COOKIE = 'roadatlas_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const JWT_ISSUER = 'roadatlas';

export interface SessionUser {
  id: string;
  email: string;
}

interface SessionRecord extends SessionUser {
  sessionVersion: number;
}

export function sessionCookieOptions(includeMaxAge = true) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
    path: '/',
    ...(includeMaxAge ? { maxAge: SESSION_SECONDS * 1000 } : {}),
  };
}

function ownerIdFromEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 24);
}

function hasSessionSecret(): boolean {
  return Boolean(env.JWT_SECRET && env.JWT_SECRET.length >= 32);
}

function hasEnvAdmin(): boolean {
  return Boolean(
    env.ADMIN_EMAIL &&
    env.ADMIN_PASSWORD_HASH &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(env.ADMIN_PASSWORD_HASH),
  );
}

/**
 * Sign-in can work when a session secret exists. With a database the user
 * collection is the source of truth; without one the configured administrator is
 * the only account the server accepts.
 */
export function authConfigured(): boolean {
  if (!hasSessionSecret()) return false;
  return hasDb || hasEnvAdmin();
}

/**
 * Verifies credentials against the user table. With a database the user
 * collection is the source of truth; without one the configured administrator
 * still signs in, but nothing is persisted — the API reports that state instead
 * of pretending to save.
 */
export async function authenticateOwner(
  email: string,
  password: string,
): Promise<SessionRecord | null> {
  if (!authConfigured()) return null;

  const normalized = email.trim().toLowerCase();

  if (hasDb) {
    const adminEmail = (env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    const existing = await db.user.findFirst({
      where: { email: normalized },
    });
    if (existing) {
      const matches = await bcrypt.compare(password, existing.passwordHash);
      return matches
        ? {
            id: existing.id,
            email: existing.email,
            sessionVersion: existing.sessionVersion ?? 0,
          }
        : null;
    }

    if (!hasEnvAdmin() || normalized !== adminEmail) return null;
    const matches = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH as string);
    if (!matches) return null;

    // The bootstrap may only create the first account. Provisioning is the
    // single-owner path; this fallback must never add a second user.
    const otherUsers = await db.user.count({
      where: { email: { not: adminEmail } },
    });
    if (otherUsers > 0) return null;

    const created = await db.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: env.ADMIN_PASSWORD_HASH as string,
        sessionVersion: 0,
      },
    });
    return {
      id: created.id,
      email: created.email,
      sessionVersion: created.sessionVersion ?? 0,
    };
  }

  if (!hasEnvAdmin()) return null;
  const adminEmail = (env.ADMIN_EMAIL as string).trim().toLowerCase();
  const emailMatches = normalized === adminEmail;
  const passwordMatches = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH as string);
  if (!emailMatches || !passwordMatches) return null;

  return { id: ownerIdFromEmail(adminEmail), email: adminEmail, sessionVersion: 0 };
}

export function createSessionToken(user: SessionUser & { sessionVersion?: number }): string {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error('Authentication is not configured.');
  }

  return jwt.sign({ email: user.email, sv: user.sessionVersion ?? 0 }, env.JWT_SECRET, {
    subject: user.id,
    issuer: JWT_ISSUER,
    expiresIn: SESSION_SECONDS,
  });
}

export function publicSessionUser(user: SessionUser): SessionUser {
  return { id: user.id, email: user.email };
}

/**
 * Resolves a session token to its user. With a database the user must still exist,
 * so deleting a user invalidates its sessions; without one only the configured
 * administrator can be resolved.
 */
export async function readSession(token: unknown): Promise<SessionUser | null> {
  if (typeof token !== 'string' || !env.JWT_SECRET || env.JWT_SECRET.length < 32) return null;

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
    });
  } catch {
    return null;
  }

  if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
  if (typeof payload.sv !== 'number') return null;

  if (hasDb) {
    const user = await db.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) return null;
    if (payload.sv !== (user.sessionVersion ?? 0)) return null;
    return { id: user.id, email: user.email };
  }

  if (!env.ADMIN_EMAIL) return null;
  const adminId = ownerIdFromEmail(env.ADMIN_EMAIL);
  if (payload.sub !== adminId || payload.sv !== 0) return null;
  return { id: adminId, email: env.ADMIN_EMAIL };
}

/** Attaches the owner when a valid session exists, without rejecting anonymous reads. */
export const optionalAuth: RequestHandler = (req, res, next) => {
  void readSession(req.cookies?.[SESSION_COOKIE])
    .then((user) => {
      if (user) {
        res.locals.ownerId = user.id;
        res.locals.ownerEmail = user.email;
      }
      next();
    })
    .catch(next);
};

export const requireAuth: RequestHandler = (req, res, next) => {
  void readSession(req.cookies?.[SESSION_COOKIE])
    .then((user) => {
      if (!user) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
      }

      res.locals.ownerId = user.id;
      res.locals.ownerEmail = user.email;
      next();
    })
    .catch(next);
};
