export type UserRole = 'holder' | 'issuer' | 'verifier' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  did: string;
  organization?: string;
  createdAt: string;
}

export type CredentialType =
  | 'StudentStatusCredential'
  | 'AgeEligibilityCredential'
  | 'ScholarshipEligibilityCredential'
  | 'ProfessionalLicenseCredential';

export interface CredentialSchemaAttribute {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  description: string;
  predicateSupported?: boolean;
}

export interface CredentialSchema {
  id: string;
  name: string;
  type: CredentialType;
  version: string;
  description: string;
  attributes: CredentialSchemaAttribute[];
  issuerDid: string;
}

export interface W3CCredentialSubject {
  id: string; // Holder DID
  [key: string]: unknown;
}

export interface W3CVerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: {
    id: string; // Issuer DID
    name: string;
  };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: W3CCredentialSubject;
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    jws?: string;
  };
}

export interface IssuedCredentialRecord {
  id: string; // JTI / UUID
  schemaType: CredentialType;
  schemaName: string;
  holderDid: string;
  holderEmail?: string;
  issuerDid: string;
  issuerName: string;
  issuanceDate: string;
  expirationDate?: string;
  claims: Record<string, unknown>;
  jwt: string;
  w3cPayload: W3CVerifiableCredential;
  status: 'active' | 'revoked' | 'expired';
  revocationReason?: string;
  revocationDate?: string;
}

export interface PredicateCondition {
  attribute: string;
  operator: '>=' | '<=' | '>' | '<' | '==' | '!=';
  value: number | string | boolean;
}

export interface VerificationPolicy {
  credentialType: CredentialType;
  allowedIssuers: string[]; // DIDs
  requiredAttributes: string[]; // attributes that must be revealed
  predicates: PredicateCondition[]; // Zero-knowledge predicate conditions
}

export interface ProofRequest {
  id: string;
  verifierDid: string;
  verifierName: string;
  purpose: string;
  policy: VerificationPolicy;
  nonce: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'presented' | 'verified' | 'rejected' | 'expired';
  deepLink: string;
}

export interface VerificationCheckDetail {
  name: string;
  passed: boolean;
  message: string;
  detail?: string;
}

export interface VerificationResult {
  id: string;
  requestId: string;
  verifierDid: string;
  holderDid: string;
  credentialType: CredentialType;
  status: 'VALID' | 'INVALID_SIGNATURE' | 'REVOKED' | 'EXPIRED' | 'UNTRUSTED_ISSUER' | 'PREDICATE_FAILED';
  isEligible: boolean;
  timestamp: string;
  checks: {
    signatureValid: VerificationCheckDetail;
    issuerTrusted: VerificationCheckDetail;
    notRevoked: VerificationCheckDetail;
    notExpired: VerificationCheckDetail;
    predicatesSatisfied: VerificationCheckDetail;
    nonceValid: VerificationCheckDetail;
  };
  disclosedClaims: Record<string, unknown>;
  verifiedPredicates: {
    attribute: string;
    condition: string;
    satisfied: boolean;
  }[];
  issuer: {
    did: string;
    name: string;
  };
}

export interface PresentationRecord {
  id: string;
  requestId: string;
  verifierName: string;
  verifierDid: string;
  holderDid: string;
  credentialType: CredentialType;
  disclosedAttributes: string[];
  predicatesProven: string[];
  timestamp: string;
  verificationStatus: 'VALID' | 'INVALID_SIGNATURE' | 'REVOKED' | 'EXPIRED' | 'UNTRUSTED_ISSUER' | 'PREDICATE_FAILED';
}

export interface TrustedIssuer {
  id: string;
  did: string;
  name: string;
  category: 'Higher Education' | 'Government & Civil' | 'Financial & Tax' | 'Professional Licensing';
  verificationMethod: 'Public Key Infrastructure (ES256)' | 'National Trust Framework (eIDAS)' | 'Decentralized Registry';
  trustStatus: 'verified' | 'provisional' | 'revoked';
  website: string;
  description: string;
  supportedSchemas: CredentialType[];
  publicKeyJwk: JsonWebKey;
  issuedCount: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  environment: 'development' | 'production';
  key?: string; // Only provided once upon generation
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
}

export interface ApiAuditLog {
  id: string;
  method: string;
  endpoint: string;
  statusCode: number;
  ip: string;
  timestamp: string;
  durationMs: number;
  apiKeyPrefix?: string;
}
