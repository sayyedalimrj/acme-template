/**
 * Express app: security headers, CORS for the three subdomains, JSON, routes, and a safe
 * error handler that never leaks stack traces or secrets.
 */
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { corsOrigins, isProduction } from '../env';
import { AppError } from '../util/errors';
import { adminRouter } from './routes/admin';
import { affiliateRouter } from './routes/affiliate';
import { authRouter } from './routes/auth';
import { merchantRouter } from './routes/merchant';

export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '64kb' }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'api', time: new Date().toISOString() }));

  app.use('/auth', authRouter);
  app.use('/admin', adminRouter);
  app.use('/affiliate', affiliateRouter);
  app.use('/merchant', merchantRouter);

  app.use((_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'یافت نشد.' } }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(500).json({ error: { code: 'internal_error', message: 'خطای داخلی سرور.' } });
  });

  return app;
}
