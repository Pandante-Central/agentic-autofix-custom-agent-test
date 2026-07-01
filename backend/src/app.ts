import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { avatarRouter } from './routes/avatar.routes';
import { calculatorRouter } from './routes/calculator.routes';
import { exportRouter } from './routes/export.routes';
import { plansRouter } from './routes/plans.routes';
import { redirectRouter } from './routes/redirect.routes';
import { settingsRouter } from './routes/settings.routes';

export function createApp() {
  const app = express();

  // VULN: A02 Security Misconfiguration - CWE-942 Overly Permissive
  // Cross-domain Whitelist
  // The CORS middleware reflects whatever `Origin` header the caller sends
  // AND allows credentials, which effectively disables the same-origin
  // protection browsers rely on and lets any site make authenticated
  // requests on a victim's behalf.
  app.use(
    cors({
      origin: (origin, callback) => callback(null, origin ?? '*'),
      credentials: true,
    })
  );

  // VULN: A02 Security Misconfiguration - CWE-1021 Improper Restriction of
  // Rendered UI Layers ("Clickjacking") / Missing HTTP Security Headers
  // No `helmet` (or equivalent) is used, so responses are missing headers
  // like X-Frame-Options, X-Content-Type-Options and Content-Security-Policy.
  app.use(bodyParser.json());
  app.use(cookieParser());

  app.use('/api/auth', authRouter);
  app.use('/api/plans', plansRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/calculator', calculatorRouter);
  app.use('/api/avatar', avatarRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/redirect', redirectRouter);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);

  return app;
}
