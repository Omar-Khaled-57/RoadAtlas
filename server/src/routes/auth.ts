import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { hasDb } from '../config/env';
import { db } from '../models/index';
import {
  authenticateOwner,
  authConfigured,
  createSessionToken,
  publicSessionUser,
  readSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from '../middleware/auth';

export const authRouter = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

authRouter.get('/session', async (req, res, next) => {
  try {
    const user = await readSession(req.cookies?.[SESSION_COOKIE]);
    res.json({ authenticated: Boolean(user), user: user ? publicSessionUser(user) : null });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Enter a valid email and password.' });
    return;
  }

  if (!authConfigured()) {
    res.status(503).json({ message: 'Sign-in is not configured on this server.' });
    return;
  }

  try {
    const user = await authenticateOwner(parsed.data.email, parsed.data.password);
    if (!user) {
      res.status(401).json({ message: 'Email or password is incorrect.' });
      return;
    }

    res.cookie(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions());
    res.json({ authenticated: true, user: publicSessionUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const user = await readSession(req.cookies?.[SESSION_COOKIE]);
    if (user && hasDb) {
      await db.update('User', user.id, { sessionVersion: ((user as { sessionVersion?: number }).sessionVersion ?? 0) + 1 });
    }
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions(false));
    res.json({ authenticated: false, user: null });
  } catch (error) {
    next(error);
  }
});
