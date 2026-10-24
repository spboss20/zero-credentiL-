import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { ApiKeyItem, WebhookConfig } from '../../src/types/index.ts';
import { db } from '../db.ts';
import { requireAuth } from './auth.ts';

export const developerRouter = Router();

// GET /api/developer/keys
developerRouter.get('/keys', (req, res) => {
  const keys = Array.from(db.apiKeys.values()).map(({ hashedSecret, ...publicFields }) => publicFields);
  res.json({ keys });
});

// POST /api/developer/keys
const createKeyZod = z.object({
  name: z.string().min(2),
  environment: z.enum(['development', 'production']).default('development'),
});

developerRouter.post('/keys', (req, res) => {
  const parse = createKeyZod.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.issues });
  }

  const id = `key-${crypto.randomUUID().slice(0, 8)}`;
  const secretBytes = crypto.randomBytes(24).toString('hex');
  const fullKey = `zp_${parse.data.environment === 'production' ? 'live' : 'test'}_${secretBytes}`;
  const prefix = fullKey.slice(0, 15) + '...';
  const hashedSecret = crypto.createHash('sha256').update(fullKey).digest('hex');

  const keyRecord: ApiKeyItem & { hashedSecret: string } = {
    id,
    name: parse.data.name,
    prefix,
    environment: parse.data.environment,
    createdAt: new Date().toISOString(),
    hashedSecret,
  };

  db.apiKeys.set(id, keyRecord);

  // Return the full key only once
  res.status(201).json({
    key: {
      ...keyRecord,
      key: fullKey,
    },
    warning: 'Please record this API key now. It cannot be shown again.',
  });
});

// DELETE /api/developer/keys/:id
developerRouter.delete('/keys/:id', (req, res) => {
  const exists = db.apiKeys.has(req.params.id);
  if (!exists) {
    return res.status(404).json({ error: 'API key not found' });
  }
  db.apiKeys.delete(req.params.id);
  res.json({ success: true, message: 'API key revoked' });
});

// GET /api/developer/webhooks
developerRouter.get('/webhooks', (req, res) => {
  const webhooks = Array.from(db.webhooks.values());
  res.json({ webhooks });
});

// POST /api/developer/webhooks
const createWebhookZod = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

developerRouter.post('/webhooks', (req, res) => {
  const parse = createWebhookZod.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.issues });
  }

  const id = `wh-${crypto.randomUUID().slice(0, 8)}`;
  const secret = `whsec_${crypto.randomBytes(16).toString('hex')}`;

  const config: WebhookConfig = {
    id,
    url: parse.data.url,
    events: parse.data.events,
    active: true,
    secret,
    createdAt: new Date().toISOString(),
  };

  db.webhooks.set(id, config);
  res.status(201).json({ webhook: config });
});

// GET /api/developer/logs
developerRouter.get('/logs', (req, res) => {
  res.json({ logs: db.auditLogs.slice(-50).reverse() });
});
