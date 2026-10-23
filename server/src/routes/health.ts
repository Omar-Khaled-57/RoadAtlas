import { Router } from 'express';
import mongoose from 'mongoose';
import { hasDb } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const connected = mongoose.connection.readyState === 1;

  res.json({
    status: 'ok',
    service: 'roadatlas-api',
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    // `disabled` means the API runs without persistence; data routes answer 503.
    database: hasDb ? (connected ? 'connected' : 'disconnected') : 'disabled',
  });
});
