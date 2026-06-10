import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind OpenLiteSpeed
  app.use(helmet({ contentSecurityPolicy: false })); // CSP tuned in Phase 9
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Portal type from Host header (spec §5)
  app.use((req, _res, next) => {
    req.portalType = req.hostname?.startsWith('work') || req.hostname?.startsWith('admin') ? 'admin' : 'public';
    next();
  });

  app.get('/api/v1/health', (_req, res) => res.json({ ok: true, data: { status: 'up', ts: new Date().toISOString() } }));
  app.use('/api/v1/auth', authRoutes);

  // Serve built SPA (client/dist) for non-API routes
  const dist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Unknown endpoint' } });
    res.sendFile(path.join(dist, 'index.html'), (err) => { if (err) res.status(200).send('LS Port — client build not deployed yet.'); });
  });

  return app;
}
