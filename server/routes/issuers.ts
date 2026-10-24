import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { CredentialSchema, TrustedIssuer } from '../../src/types/index.ts';
import { getIssuerPublicJwk } from '../crypto.ts';
import { db } from '../db.ts';
import { getAuthenticatedUser, requireRole } from './auth.ts';

export const issuersRouter = Router();

// GET /api/issuers
issuersRouter.get('/', (req, res) => {
  const list = Array.from(db.issuers.values());
  res.json({ issuers: list });
});

// GET /api/issuers/schemas
issuersRouter.get('/schemas', (req, res) => {
  const schemas = Array.from(db.schemas.values());
  res.json({ schemas });
});

// GET /api/issuers/schemas/:id
issuersRouter.get('/schemas/:id', (req, res) => {
  const schema = db.schemas.get(req.params.id);
  if (!schema) {
    return res.status(404).json({ error: 'Schema not found' });
  }
  res.json({ schema });
});

// POST /api/issuers/schemas (Authorized Issuers / Admins only)
const createSchemaZod = z.object({
  name: z.string().min(3),
  type: z.enum([
    'StudentStatusCredential',
    'AgeEligibilityCredential',
    'ScholarshipEligibilityCredential',
    'ProfessionalLicenseCredential',
  ]),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(10),
  attributes: z.array(
    z.object({
      name: z.string().min(1),
      type: z.enum(['string', 'number', 'boolean', 'date']),
      required: z.boolean(),
      description: z.string(),
      predicateSupported: z.boolean().optional(),
    })
  ).min(1),
});

issuersRouter.post('/schemas', requireRole(['issuer', 'admin']), (req: any, res) => {
  const parse = createSchemaZod.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.issues });
  }

  const user = req.user;
  const id = `sch-${crypto.randomUUID().slice(0, 8)}`;
  const newSchema: CredentialSchema = {
    id,
    ...parse.data,
    issuerDid: user.did,
  };

  db.schemas.set(id, newSchema);
  res.status(201).json({ schema: newSchema });
});

// GET /api/issuers/:id
issuersRouter.get('/:id', async (req, res) => {
  const issuer =
    db.issuers.get(req.params.id) ||
    Array.from(db.issuers.values()).find((i) => i.did === req.params.id);

  if (!issuer) {
    return res.status(404).json({ error: 'Issuer not found' });
  }

  const jwk = await getIssuerPublicJwk(issuer.did);
  res.json({
    issuer: {
      ...issuer,
      publicKeyJwk: jwk || issuer.publicKeyJwk,
    },
  });
});

// GET /api/issuers/:did/did.json (W3C DID Document Resolution)
issuersRouter.get('/:did/did.json', async (req, res) => {
  const did = req.params.did;
  const issuer = Array.from(db.issuers.values()).find((i) => i.did === did);
  const jwk = await getIssuerPublicJwk(did);

  if (!jwk) {
    return res.status(404).json({ error: 'DID document not found' });
  }

  const didDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/jws-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'JsonWebKey2020',
        controller: did,
        publicKeyJwk: jwk,
      },
    ],
    authentication: [`${did}#key-1`],
    assertionMethod: [`${did}#key-1`],
    service: issuer
      ? [
          {
            id: `${did}#issuer-service`,
            type: 'CredentialIssuerService',
            serviceEndpoint: issuer.website,
          },
        ]
      : [],
  };

  res.setHeader('Content-Type', 'application/did+json');
  res.json(didDocument);
});

// GET /api/issuers/:id/stats
issuersRouter.get('/:id/stats', (req, res) => {
  const issuer =
    db.issuers.get(req.params.id) ||
    Array.from(db.issuers.values()).find((i) => i.did === req.params.id);

  if (!issuer) {
    return res.status(404).json({ error: 'Issuer not found' });
  }

  const credentials = Array.from(db.credentials.values()).filter((c) => c.issuerDid === issuer.did);
  const activeCount = credentials.filter((c) => c.status === 'active').length;
  const revokedCount = credentials.filter((c) => c.status === 'revoked').length;
  const expiredCount = credentials.filter((c) => c.status === 'expired').length;

  res.json({
    stats: {
      totalIssued: issuer.issuedCount + credentials.length,
      managedCredentials: credentials.length,
      activeCount,
      revokedCount,
      expiredCount,
      trustStatus: issuer.trustStatus,
      verificationMethod: issuer.verificationMethod,
    },
  });
});
