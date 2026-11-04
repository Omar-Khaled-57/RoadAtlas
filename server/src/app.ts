import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { roadmapsRouter } from './routes/roadmaps';
import { stepsRouter } from './routes/steps';
import { metricsRouter } from './routes/metrics';
import { comparisonsRouter } from './routes/comparisons';
import { notesRouter } from './routes/notes';
import { decisionsRouter } from './routes/decisions';
import { focusRouter } from './routes/focus';
import { errorHandler, notFound } from './middleware/error';
import { requirePersistence } from './middleware/persistence';
import { requireTrustedOrigin } from './middleware/origin';
import { accessLog, requestContext } from './middleware/observability';

export function createApp() {
  const app = express();

  app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
  app.use(requestContext);
  app.use(accessLog);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use('/api', requireTrustedOrigin);

  // Broad abuse ceiling for the whole API; auth has a stricter limiter of its own.
  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);

  app.use('/api/roadmaps', requirePersistence, roadmapsRouter);
  app.use('/api/steps', requirePersistence, stepsRouter);
  app.use('/api/metrics', requirePersistence, metricsRouter);
  app.use('/api/comparisons', requirePersistence, comparisonsRouter);
  app.use('/api/notes', requirePersistence, notesRouter);
  app.use('/api/decisions', requirePersistence, decisionsRouter);
  app.use('/api/focus', focusRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
