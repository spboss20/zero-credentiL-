import { Router } from 'express';
import { z } from 'zod';
import type { CredentialType, IssuedCredentialRecord } from '../../src/types/index.ts';
import { signVerifiableCredential, verifyCredentialJwt } from '../crypto.ts';
import { db } from '../db.ts';
import { getAuthenticatedUser, requireAuth, requireRole } from './auth.ts';

export const credentialsRouter = Router();

const issueCredentialZod = z.object({
  schemaType: z.enum([
    'StudentStatusCredential',
    'AgeEligibilityCredential',
    'ScholarshipEligibilityCredential',
    'ProfessionalLicenseCredential',
  ]),
  holderDid: z.string().min(5),
  holderEmail: z.string().email().optional(),
  claims: z.record(z.string(), z.any()),
  expirationDays: z.number().int().positive().optional().default(365),
});

// GET /api/credentials
credentialsRouter.get('/', (req, res) => {
  const user = getAuthenticatedUser(req);
  const { holderDid, issuerDid } = req.query;

  let list = Array.from(db.credentials.values());

  if (holderDid) {
    list = list.filter((c) => c.holderDid === holderDid);
  } else if (issuerDid) {
    list = list.filter((c) => c.issuerDid === issuerDid);
  } else if (user) {
    if (user.role === 'holder') {
      list = list.filter((c) => c.holderDid === user.did || (user.email && c.holderEmail === user.email));
    } else if (user.role === 'issuer') {
      list = list.filter((c) => c.issuerDid === user.did);
    }
  }

  res.json({ credentials: list });
});

// GET /api/credentials/:id
credentialsRouter.get('/:id', (req, res) => {
  const credential =
    db.credentials.get(req.params.id) ||
    Array.from(db.credentials.values()).find((c) => c.id === req.params.id);

  if (!credential) {
    return res.status(404).json({ error: 'Credential not found' });
  }

  res.json({ credential });
});

// POST /api/credentials (Issue a new cryptographically signed W3C VC)
credentialsRouter.post('/', requireRole(['issuer', 'admin']), async (req: any, res) => {
  const parse = issueCredentialZod.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error.issues });
  }

  const { schemaType, holderDid, holderEmail, claims, expirationDays } = parse.data;
  const user = req.user;

  // Retrieve schema to validate required fields
  const schema = Array.from(db.schemas.values()).find((s) => s.type === schemaType);
  if (schema) {
    for (const attr of schema.attributes) {
      if (attr.required && (claims[attr.name] === undefined || claims[attr.name] === '')) {
        return res.status(400).json({
          error: `Missing required attribute '${attr.name}' according to schema '${schema.name}'`,
        });
      }
    }
  }

  try {
    const issuerName = user.organization || user.name || 'Accredited Issuer';
    const signed = await signVerifiableCredential({
      issuerDid: user.did,
      issuerName,
      holderDid,
      schemaType,
      claims,
      expirationDays,
    });

    const record: IssuedCredentialRecord = {
      id: signed.credentialId,
      schemaType,
      schemaName: schema?.name || schemaType,
      holderDid,
      holderEmail,
      issuerDid: user.did,
      issuerName,
      issuanceDate: signed.w3cPayload.issuanceDate,
      expirationDate: signed.w3cPayload.expirationDate,
      claims,
      jwt: signed.jwt,
      w3cPayload: signed.w3cPayload,
      status: 'active',
    };

    db.credentials.set(record.id, record);

    // Update issuer stats
    const trustedIssuer = Array.from(db.issuers.values()).find((i) => i.did === user.did);
    if (trustedIssuer) {
      trustedIssuer.issuedCount++;
    }

    res.status(201).json({
      success: true,
      credential: record,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Issuance failed';
    res.status(500).json({ error: 'Failed to cryptographically sign credential', details: message });
  }
});

// POST /api/credentials/:id/revoke
credentialsRouter.post('/:id/revoke', requireRole(['issuer', 'admin']), (req: any, res) => {
  const { reason = 'Revoked by authorized issuer' } = req.body;
  const user = req.user;

  const credential =
    db.credentials.get(req.params.id) ||
    Array.from(db.credentials.values()).find((c) => c.id === req.params.id);

  if (!credential) {
    return res.status(404).json({ error: 'Credential not found' });
  }

  // Authorization check: only issuing authority or admin can revoke
  if (user.role !== 'admin' && credential.issuerDid !== user.did) {
    return res.status(403).json({ error: 'Forbidden: You can only revoke credentials issued by your organization' });
  }

  credential.status = 'revoked';
  credential.revocationReason = reason;
  credential.revocationDate = new Date().toISOString();

  db.revokedCredentialIds.add(credential.id);
  db.credentials.set(credential.id, credential);

  res.json({
    success: true,
    message: 'Credential successfully revoked and recorded in revocation registry',
    credential,
  });
});

// POST /api/credentials/verify-raw (Real-time cryptographic audit)
credentialsRouter.post('/verify-raw', async (req, res) => {
  const { jwt } = req.body;
  if (!jwt || typeof jwt !== 'string') {
    return res.status(400).json({ error: 'Missing jwt string' });
  }

  const result = await verifyCredentialJwt(jwt);
  if (!result.isValid || !result.payload) {
    return res.json({
      valid: false,
      status: 'INVALID_SIGNATURE',
      error: result.error || 'Cryptographic signature is invalid or tampered',
    });
  }

  const jti = result.payload.jti as string;
  const isRevoked = jti ? db.revokedCredentialIds.has(jti) : false;
  const exp = result.payload.exp ? result.payload.exp * 1000 : Infinity;
  const isExpired = Date.now() > exp;

  let status = 'VALID';
  if (isRevoked) status = 'REVOKED';
  else if (isExpired) status = 'EXPIRED';

  res.json({
    valid: status === 'VALID',
    status,
    issuer: result.payload.iss,
    subject: result.payload.sub,
    expiration: result.payload.exp ? new Date(result.payload.exp * 1000).toISOString() : null,
    claims: (result.payload.vc as any)?.credentialSubject || null,
  });
});
