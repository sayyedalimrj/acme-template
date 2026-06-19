/**
 * Express app: security headers, compression, CORS for the three subdomains, request timeout,
 * routes, and a safe error handler that never leaks stack traces or secrets.
 */
import compression from 'compression';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';

import { corsOrigins, isProduction } from '../env';
import { AppError } from '../util/errors';
import { redactSensitiveText } from '../services/security/redaction';
import { adminRouter } from './routes/admin';
import { affiliateRouter } from './routes/affiliate';
import { authRouter } from './routes/auth';
import { billingRouter } from './routes/billing';
import { merchantRouter } from './routes/merchant';
import { pluginRouter } from './routes/plugin';
import { webhookRouter } from './routes/webhooks';

/** Reject requests that hang too long (defense against slowloris / stuck upstreams). */
function requestTimeout(ms: number) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(503).json({ error: { code: 'timeout', message: 'درخواست زمان‌بر شد.' } });
      }
    });
    next();
  };
}

export function createApp(): express.Express {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  app.use(requestTimeout(30_000));
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: false,
    }),
  );

  app.get('/health', (_req, res) =>
    res.json({ ok: true, service: 'api', time: new Date().toISOString() }),
  );

  // Plugin + webhook routers parse the RAW body themselves (exact-bytes HMAC), so they must be
  // mounted BEFORE the global JSON parser.
  app.use('/plugin', pluginRouter);
  app.use('/webhooks', webhookRouter);

  // JSON parser for the rest of the API.
  app.use(express.json({ limit: '256kb' }));

  app.use('/auth', authRouter);
  app.use('/admin', adminRouter);
  app.use('/affiliate', affiliateRouter);
  app.use('/merchant', merchantRouter);
  app.use('/billing', billingRouter);

  app.use((_req, res) => res.status(404).json({ error: { code: 'not_found', message: 'یافت نشد.' } }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message } });
      return;
    }
    if (!isProduction) {
      // eslint-disable-next-line no-console
      console.error(redactSensitiveText(String((err as Error)?.stack ?? err)));
    }
    res.status(500).json({ error: { code: 'internal_error', message: 'خطای داخلی سرور.' } });
  });

  return app;
}
