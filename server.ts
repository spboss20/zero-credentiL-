import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth.ts';
import { credentialsRouter } from './server/routes/credentials.ts';
import { developerRouter } from './server/routes/developer.ts';
import { digilockerRouter } from './server/routes/digilocker.ts';
import { issuersRouter } from './server/routes/issuers.ts';
import { verifierRouter } from './server/routes/verifier.ts';
import { db } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Non-sensitive structured request audit logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      // Exclude asset requests from API logs
      if (req.path.startsWith('/api')) {
        const authHeader = req.headers.authorization;
        const keyPrefix = authHeader?.startsWith('Bearer zp_') ? authHeader.slice(7, 18) + '...' : undefined;
        db.auditLogs.push({
          id: `log-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          method: req.method,
          endpoint: req.path,
          statusCode: res.statusCode,
          ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
          timestamp: new Date().toISOString(),
          durationMs,
          apiKeyPrefix: keyPrefix,
        });
      }
    });
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'ZeroPass Verifiable Credential Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      standards: ['W3C VC 2.0', 'JOSE RFC 7519', 'DID Core 1.0', 'ES256 P-256'],
      uptime: process.uptime(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/issuers', issuersRouter);
  app.use('/api/credentials', credentialsRouter);
  app.use('/api', verifierRouter); // /api/verification-requests, /api/verifications, /api/presentations
  app.use('/api/developer', developerRouter);
  app.use('/api/digilocker', digilockerRouter);

  // Serve Frontend
  if (!isProduction) {
    // Development mode: mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Centralized Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('ZeroPass Server Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZeroPass Verifiable Credential Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ZeroPass server:', err);
  process.exit(1);
});
