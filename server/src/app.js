import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import studentRoutes from './routes/students.js';
import adminRoutes from './routes/admin.js';
import queryRoutes from './routes/queries.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.use((req, _res, next) => {
    req.portalType = req.hostname?.startsWith('work') || req.hostname?.startsWith('admin') ? 'admin' : 'public';
    next();
  });

  app.get('/api/v1/health', (_req, res) => res.json({ ok: true, data: { status: 'up', ts: new Date().toISOString() } }));
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/courses', courseRoutes);
  app.use('/api/v1/students', studentRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/queries', queryRoutes);

  const dist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Unknown endpoint' } });
    res.sendFile(path.join(dist, 'index.html'), (err) => { if (err) res.status(200).send('LS Port — client build not deployed yet.'); });
  });

  // Global JSON error handler — prevents HTML 500 responses that break frontend JSON parsing
  app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({ ok: false, error: { code: 'SERVER_ERROR', message: err.message || 'Internal server error' } });
  });

  return app;
}
