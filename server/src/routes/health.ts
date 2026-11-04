import { Router } from 'express';
import { hasDb } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'roadatlas-api',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    // `disabled` means the API runs without persistence; data routes answer 503.
    database: hasDb ? 'connected' : 'disabled',
  });
});
