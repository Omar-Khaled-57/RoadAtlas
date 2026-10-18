import { createHash } from 'node:crypto';
import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const SESSION_COOKIE = 'roadatlas_session';
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const JWT_ISSUER = 'roadatlas';

export interface SessionUser {
  id: string;
  email: string;
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

function hasAuthConfiguration(): boolean {
  return Boolean(
    env.JWT_SECRET &&
    env.JWT_SECRET.length >= 32 &&
    env.ADMIN_EMAIL &&
    env.ADMIN_PASSWORD_HASH &&
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(env.ADMIN_PASSWORD_HASH),
  );
}

export async function authenticateOwner(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  if (!hasAuthConfiguration() || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) return null;

  const emailMatches = email.trim().toLowerCase() === env.ADMIN_EMAIL.trim().toLowerCase();
  const passwordMatches = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  if (!emailMatches || !passwordMatches) return null;

  return {
    id: ownerIdFromEmail(env.ADMIN_EMAIL),
    email: env.ADMIN_EMAIL,
  };
}

export function createSessionToken(user: SessionUser): string {
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    throw new Error('Authentication is not configured.');
  }

  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: user.id,
    issuer: JWT_ISSUER,
    expiresIn: SESSION_SECONDS,
  });
}

export function readSession(token: unknown): SessionUser | null {
  if (typeof token !== 'string' || !env.JWT_SECRET || !env.ADMIN_EMAIL) return null;

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { issuer: JWT_ISSUER });
    if (typeof payload === 'string' || payload.sub !== ownerIdFromEmail(env.ADMIN_EMAIL))
      return null;

    return {
      id: payload.sub,
      email: env.ADMIN_EMAIL,
    };
  } catch {
    return null;
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const user = readSession(req.cookies?.[SESSION_COOKIE]);
  if (!user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  res.locals.ownerId = user.id;
  res.locals.ownerEmail = user.email;
  next();
};
