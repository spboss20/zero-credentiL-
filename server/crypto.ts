import * as jose from 'jose';
import crypto from 'node:crypto';
import type { CredentialType, PredicateCondition, W3CVerifiableCredential } from '../src/types/index.ts';

// In-memory cryptographic key store for issuers
// In production, these private keys are stored in an HSM or KMS (AWS KMS, Google Cloud KMS, Vault)
interface IssuerKeypair {
  did: string;
  privateKey: any;
  publicKey: any;
  publicKeyJwk: jose.JWK;
}

const issuerKeypairs = new Map<string, IssuerKeypair>();

/**
 * Initialize or get an ES256 keypair for an issuer DID
 */
export async function getOrCreateIssuerKeypair(did: string): Promise<IssuerKeypair> {
  const existing = issuerKeypairs.get(did);
  if (existing) return existing;

  // Generate real P-256 ECDSA key pair (ES256)
  const { privateKey, publicKey } = await jose.generateKeyPair('ES256', {
    extractable: true,
  });

  const publicKeyJwk = await jose.exportJWK(publicKey);
  publicKeyJwk.kid = `${did}#key-1`;
  publicKeyJwk.use = 'sig';
  publicKeyJwk.alg = 'ES256';

  const pair: IssuerKeypair = {
    did,
    privateKey,
    publicKey,
    publicKeyJwk,
  };

  issuerKeypairs.set(did, pair);
  return pair;
}

/**
 * Get public JWK for an issuer
 */
export async function getIssuerPublicJwk(did: string): Promise<jose.JWK | null> {
  const pair = await getOrCreateIssuerKeypair(did);
  return pair.publicKeyJwk;
}

/**
 * Issue and cryptographically sign a W3C Verifiable Credential as a JWT (RFC 7519 / W3C VC 2.0)
 */
export async function signVerifiableCredential(params: {
  issuerDid: string;
  issuerName: string;
  holderDid: string;
  schemaType: CredentialType;
  claims: Record<string, unknown>;
  expirationDays?: number;
}): Promise<{ jwt: string; w3cPayload: W3CVerifiableCredential; credentialId: string }> {
  const { issuerDid, issuerName, holderDid, schemaType, claims, expirationDays = 365 } = params;
  const keypair = await getOrCreateIssuerKeypair(issuerDid);

  const credentialId = `urn:uuid:${crypto.randomUUID()}`;
  const now = new Date();
  const expDate = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

  const issuanceDateIso = now.toISOString();
  const expDateIso = expDate.toISOString();

  // Construct W3C standard JSON-LD payload
  const w3cPayload: W3CVerifiableCredential = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schema.zeropass.id/v1',
    ],
    id: credentialId,
    type: ['VerifiableCredential', schemaType],
    issuer: {
      id: issuerDid,
      name: issuerName,
    },
    issuanceDate: issuanceDateIso,
    expirationDate: expDateIso,
    credentialSubject: {
      id: holderDid,
      ...claims,
    },
    proof: {
      type: 'JsonWebSignature2020',
      created: issuanceDateIso,
      verificationMethod: `${issuerDid}#key-1`,
      proofPurpose: 'assertionMethod',
    },
  };

  // Sign with ES256 using jose
  const jwt = await new jose.SignJWT({
    vc: w3cPayload,
    sub: holderDid,
    iss: issuerDid,
    jti: credentialId,
    schema: schemaType,
  })
    .setProtectedHeader({ alg: 'ES256', typ: 'JWT', kid: `${issuerDid}#key-1` })
    .setIssuedAt(Math.floor(now.getTime() / 1000))
    .setExpirationTime(Math.floor(expDate.getTime() / 1000))
    .setIssuer(issuerDid)
    .setSubject(holderDid)
    .sign(keypair.privateKey);

  w3cPayload.proof!.jws = jwt;

  return { jwt, w3cPayload, credentialId };
}

/**
 * Verify a W3C Verifiable Credential JWT cryptographically
 */
export async function verifyCredentialJwt(jwt: string): Promise<{
  isValid: boolean;
  payload: jose.JWTPayload | null;
  error?: string;
}> {
  try {
    const unverifiedHeader = jose.decodeProtectedHeader(jwt);
    const unverifiedPayload = jose.decodeJwt(jwt);

    const issuerDid = unverifiedPayload.iss;
    if (!issuerDid) {
      return { isValid: false, payload: null, error: 'Missing issuer (iss) in credential JWT' };
    }

    const keypair = await getOrCreateIssuerKeypair(issuerDid);

    const { payload } = await jose.jwtVerify(jwt, keypair.publicKey, {
      algorithms: ['ES256'],
      issuer: issuerDid,
    });

    return { isValid: true, payload };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cryptographic verification failed';
    return { isValid: false, payload: null, error: message };
  }
}

/**
 * Evaluate zero-knowledge style predicates against credential attributes
 * Calculates age from date-of-birth, numeric predicates, and string matching
 */
export function evaluatePredicate(
  attributeValue: unknown,
  condition: PredicateCondition,
  serverDate: Date = new Date()
): { satisfied: boolean; detail: string } {
  const { attribute, operator, value } = condition;

  if (attributeValue === undefined || attributeValue === null) {
    return { satisfied: false, detail: `Attribute '${attribute}' is missing from credential` };
  }

  // Handle Date of Birth special case for age predicates
  if (attribute === 'dateOfBirth' || attribute === 'birthDate') {
    const dob = new Date(String(attributeValue));
    if (isNaN(dob.getTime())) {
      return { satisfied: false, detail: 'Invalid dateOfBirth format in credential' };
    }

    let calculatedAge = serverDate.getFullYear() - dob.getFullYear();
    const monthDiff = serverDate.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && serverDate.getDate() < dob.getDate())) {
      calculatedAge--;
    }

    const targetAge = Number(value);
    let ok = false;
    if (operator === '>=') ok = calculatedAge >= targetAge;
    else if (operator === '<=') ok = calculatedAge <= targetAge;
    else if (operator === '>') ok = calculatedAge > targetAge;
    else if (operator === '<') ok = calculatedAge < targetAge;
    else if (operator === '==') ok = calculatedAge === targetAge;

    return {
      satisfied: ok,
      detail: ok
        ? `Age predicate verified: calculated age (${calculatedAge}) satisfies condition ${operator} ${targetAge}`
        : `Age predicate failed: calculated age (${calculatedAge}) does not satisfy ${operator} ${targetAge}`,
    };
  }

  // Handle standard numeric comparisons
  if (typeof attributeValue === 'number' || !isNaN(Number(attributeValue))) {
    const numAttr = Number(attributeValue);
    const numTarget = Number(value);

    let ok = false;
    if (operator === '>=') ok = numAttr >= numTarget;
    else if (operator === '<=') ok = numAttr <= numTarget;
    else if (operator === '>') ok = numAttr > numTarget;
    else if (operator === '<') ok = numAttr < numTarget;
    else if (operator === '==') ok = numAttr === numTarget;
    else if (operator === '!=') ok = numAttr !== numTarget;

    return {
      satisfied: ok,
      detail: ok
        ? `Predicate passed: ${attribute} value satisfies ${operator} ${numTarget}`
        : `Predicate failed: ${attribute} value does not satisfy ${operator} ${numTarget}`,
    };
  }

  // Handle boolean / string equality
  if (operator === '==' || operator === '!=') {
    const eq = String(attributeValue).toLowerCase() === String(value).toLowerCase();
    const ok = operator === '==' ? eq : !eq;
    return {
      satisfied: ok,
      detail: ok
        ? `Value equality predicate satisfied for ${attribute}`
        : `Value equality predicate failed for ${attribute}`,
    };
  }

  return { satisfied: false, detail: `Unsupported predicate operator '${operator}' on attribute '${attribute}'` };
}

/**
 * Generate cryptographic hash (SHA-256) of arbitrary object or string
 */
export function sha256(data: string | object): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}
