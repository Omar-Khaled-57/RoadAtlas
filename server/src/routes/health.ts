import { Router } from 'express';
import { pool } from '../lib/db';
import { hasDb } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let database: 'connected' | 'disconnected' | 'disabled' = 'disabled';
  if (hasDb) {
    try {
      await pool.query('SELECT 1');
      database = 'connected';
    } catch {
      database = 'disconnected';
    }
  }

  res.json({
    status: 'ok',
    service: 'roadatlas-api',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database,
  });
});
