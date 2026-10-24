import crypto from 'node:crypto';
import type {
  ApiAuditLog,
  ApiKeyItem,
  CredentialSchema,
  CredentialType,
  IssuedCredentialRecord,
  PresentationRecord,
  ProofRequest,
  TrustedIssuer,
  User,
  VerificationResult,
  WebhookConfig,
} from '../src/types/index.ts';
import { getIssuerPublicJwk, signVerifiableCredential } from './crypto.ts';

// In-Memory Database Store with realistic development data
class DatabaseStore {
  users: Map<string, User> = new Map();
  sessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  issuers: Map<string, TrustedIssuer> = new Map();
  schemas: Map<string, CredentialSchema> = new Map();
  credentials: Map<string, IssuedCredentialRecord> = new Map();
  verificationRequests: Map<string, ProofRequest> = new Map();
  presentations: Map<string, PresentationRecord> = new Map();
  verificationResults: Map<string, VerificationResult> = new Map();
  apiKeys: Map<string, ApiKeyItem & { hashedSecret: string }> = new Map();
  webhooks: Map<string, WebhookConfig> = new Map();
  auditLogs: ApiAuditLog[] = [];
  revokedCredentialIds: Set<string> = new Set();

  private initialized = false;

  async init() {
    if (this.initialized) return;

    // Seed default users
    const holderUser: User = {
      id: 'usr-holder-01',
      email: 'sakshampatwa84@gmail.com',
      name: 'Saksham Patwa',
      role: 'holder',
      did: 'did:zeropass:holder-sp-8842',
      createdAt: '2026-01-15T09:00:00Z',
    };

    const issuerUser: User = {
      id: 'usr-issuer-01',
      email: 'issuer@aethelgard.edu',
      name: 'Dr. Evelyn Vance (Registrar)',
      role: 'issuer',
      did: 'did:zeropass:issuer-aethelgard-7701',
      organization: 'Aethelgard Polytechnic University [Dev Institution]',
      createdAt: '2026-01-10T09:00:00Z',
    };

    const verifierUser: User = {
      id: 'usr-verifier-01',
      email: 'verifier@apexcorp.com',
      name: 'Marcus Sterling (Compliance Officer)',
      role: 'verifier',
      did: 'did:zeropass:verifier-apex-3321',
      organization: 'Apex Global Financial Verification [Dev Partner]',
      createdAt: '2026-02-01T09:00:00Z',
    };

    const adminUser: User = {
      id: 'usr-admin-01',
      email: 'admin@zeropass.id',
      name: 'System Governance Administrator',
      role: 'admin',
      did: 'did:zeropass:admin-root-0001',
      organization: 'ZeroPass Foundation [Dev Environment]',
      createdAt: '2026-01-01T00:00:00Z',
    };

    this.users.set(holderUser.id, holderUser);
    this.users.set(issuerUser.id, issuerUser);
    this.users.set(verifierUser.id, verifierUser);
    this.users.set(adminUser.id, adminUser);

    // Seed Trusted Issuers
    const aethelgardJwk = (await getIssuerPublicJwk(issuerUser.did)) || {};
    const issuerAethelgard: TrustedIssuer = {
      id: 'iss-01',
      did: issuerUser.did,
      name: 'Aethelgard Polytechnic University [Dev Institution]',
      category: 'Higher Education',
      verificationMethod: 'Public Key Infrastructure (ES256)',
      trustStatus: 'verified',
      website: 'https://aethelgard.polytechnic.dev',
      description: 'Accredited university research issuer testing student status and degree verification credentials.',
      supportedSchemas: ['StudentStatusCredential', 'ScholarshipEligibilityCredential'],
      publicKeyJwk: aethelgardJwk,
      issuedCount: 142,
    };

    const veritasDid = 'did:zeropass:issuer-veritas-civil-5510';
    const veritasJwk = (await getIssuerPublicJwk(veritasDid)) || {};
    const issuerVeritas: TrustedIssuer = {
      id: 'iss-02',
      did: veritasDid,
      name: 'Veritas Civil Records Authority [Dev Mock]',
      category: 'Government & Civil',
      verificationMethod: 'Public Key Infrastructure (ES256)',
      trustStatus: 'verified',
      website: 'https://civil.veritas.gov.dev',
      description: 'Simulated civil registry for testing age qualification and identity credential predicates.',
      supportedSchemas: ['AgeEligibilityCredential'],
      publicKeyJwk: veritasJwk,
      issuedCount: 388,
    };

    const fellowshipDid = 'did:zeropass:issuer-academica-9920';
    const fellowshipJwk = (await getIssuerPublicJwk(fellowshipDid)) || {};
    const issuerFellowship: TrustedIssuer = {
      id: 'iss-03',
      did: fellowshipDid,
      name: 'Global Academic Fellowship Trust [Dev Institution]',
      category: 'Financial & Tax',
      verificationMethod: 'Public Key Infrastructure (ES256)',
      trustStatus: 'verified',
      website: 'https://fellowship.global-academic.dev',
      description: 'International scholarship endowment proving income and merit credentials under zero-knowledge.',
      supportedSchemas: ['ScholarshipEligibilityCredential'],
      publicKeyJwk: fellowshipJwk,
      issuedCount: 89,
    };

    const barDid = 'did:zeropass:issuer-apex-bar-2209';
    const barJwk = (await getIssuerPublicJwk(barDid)) || {};
    const issuerBar: TrustedIssuer = {
      id: 'iss-04',
      did: barDid,
      name: 'Board of Professional Engineering & Bar [Dev Board]',
      category: 'Professional Licensing',
      verificationMethod: 'Public Key Infrastructure (ES256)',
      trustStatus: 'verified',
      website: 'https://licensing.apex-board.dev',
      description: 'Accredited testing body for engineering, legal, and health practice licenses.',
      supportedSchemas: ['ProfessionalLicenseCredential'],
      publicKeyJwk: barJwk,
      issuedCount: 64,
    };

    this.issuers.set(issuerAethelgard.id, issuerAethelgard);
    this.issuers.set(issuerVeritas.id, issuerVeritas);
    this.issuers.set(issuerFellowship.id, issuerFellowship);
    this.issuers.set(issuerBar.id, issuerBar);

    // Seed Credential Schemas
    const schemaStudent: CredentialSchema = {
      id: 'sch-student-v1',
      name: 'Student Status Credential',
      type: 'StudentStatusCredential',
      version: '1.2.0',
      description: 'Verifies active university enrollment, degree program, GPA, and graduation cohort.',
      issuerDid: issuerAethelgard.did,
      attributes: [
        { name: 'fullName', type: 'string', required: true, description: 'Student legal full name' },
        { name: 'studentId', type: 'string', required: true, description: 'University identification number' },
        { name: 'institution', type: 'string', required: true, description: 'Name of academic institution' },
        { name: 'degreeProgram', type: 'string', required: true, description: 'Enrolled degree or major' },
        { name: 'gpa', type: 'number', required: true, description: 'Cumulative Grade Point Average (0.00-4.00)', predicateSupported: true },
        { name: 'enrollmentStatus', type: 'string', required: true, description: 'Active, OnLeave, or Graduated' },
        { name: 'expectedGraduationYear', type: 'number', required: true, description: 'Graduation target year', predicateSupported: true },
      ],
    };

    const schemaAge: CredentialSchema = {
      id: 'sch-age-v1',
      name: 'Age & Civil Eligibility Credential',
      type: 'AgeEligibilityCredential',
      version: '2.0.1',
      description: 'Verifies birth date and legal majority without disclosing full government identification numbers.',
      issuerDid: issuerVeritas.did,
      attributes: [
        { name: 'fullName', type: 'string', required: true, description: 'Citizen full legal name' },
        { name: 'dateOfBirth', type: 'date', required: true, description: 'ISO date of birth (YYYY-MM-DD)', predicateSupported: true },
        { name: 'countryOfBirth', type: 'string', required: true, description: 'ISO-3166 country of birth' },
        { name: 'documentNumber', type: 'string', required: true, description: 'Civil register document identifier' },
      ],
    };

    const schemaScholarship: CredentialSchema = {
      id: 'sch-scholarship-v1',
      name: 'Scholarship Eligibility Credential',
      type: 'ScholarshipEligibilityCredential',
      version: '1.0.0',
      description: 'Certifies verified household income threshold and academic merit criteria for scholarship programs.',
      issuerDid: issuerFellowship.did,
      attributes: [
        { name: 'beneficiaryName', type: 'string', required: true, description: 'Scholarship applicant name' },
        { name: 'annualHouseholdIncome', type: 'number', required: true, description: 'Verified tax-year household income in USD', predicateSupported: true },
        { name: 'gpa', type: 'number', required: true, description: 'Verified academic GPA', predicateSupported: true },
        { name: 'meritTier', type: 'string', required: true, description: 'Merit category (Summa, Magna, Standard)' },
        { name: 'academicYear', type: 'string', required: true, description: 'Academic grant award cycle' },
      ],
    };

    const schemaLicense: CredentialSchema = {
      id: 'sch-license-v1',
      name: 'Professional Practice License',
      type: 'ProfessionalLicenseCredential',
      version: '1.1.0',
      description: 'Certifies authorized professional practice in good standing.',
      issuerDid: issuerBar.did,
      attributes: [
        { name: 'licenseeName', type: 'string', required: true, description: 'Licensed professional full name' },
        { name: 'licenseNumber', type: 'string', required: true, description: 'Official registration license code' },
        { name: 'fieldOfPractice', type: 'string', required: true, description: 'Specialization (e.g. Software Systems Architecture)' },
        { name: 'jurisdiction', type: 'string', required: true, description: 'State or Regional jurisdiction' },
        { name: 'status', type: 'string', required: true, description: 'Good Standing, Suspended, Inactive' },
      ],
    };

    this.schemas.set(schemaStudent.id, schemaStudent);
    this.schemas.set(schemaAge.id, schemaAge);
    this.schemas.set(schemaScholarship.id, schemaScholarship);
    this.schemas.set(schemaLicense.id, schemaLicense);

    // Issue initial real cryptographically signed W3C credentials to holder
    const studentIssued = await signVerifiableCredential({
      issuerDid: issuerAethelgard.did,
      issuerName: issuerAethelgard.name,
      holderDid: holderUser.did,
      schemaType: 'StudentStatusCredential',
      claims: {
        fullName: 'Saksham Patwa',
        studentId: 'APU-2024-8849',
        institution: 'Aethelgard Polytechnic University',
        degreeProgram: 'B.S. Distributed Systems & Cryptographic Engineering',
        gpa: 3.86,
        enrollmentStatus: 'Active',
        expectedGraduationYear: 2027,
      },
      expirationDays: 365,
    });

    const studentRecord: IssuedCredentialRecord = {
      id: studentIssued.credentialId,
      schemaType: 'StudentStatusCredential',
      schemaName: 'Student Status Credential',
      holderDid: holderUser.did,
      holderEmail: holderUser.email,
      issuerDid: issuerAethelgard.did,
      issuerName: issuerAethelgard.name,
      issuanceDate: studentIssued.w3cPayload.issuanceDate,
      expirationDate: studentIssued.w3cPayload.expirationDate,
      claims: studentIssued.w3cPayload.credentialSubject,
      jwt: studentIssued.jwt,
      w3cPayload: studentIssued.w3cPayload,
      status: 'active',
    };

    const ageIssued = await signVerifiableCredential({
      issuerDid: issuerVeritas.did,
      issuerName: issuerVeritas.name,
      holderDid: holderUser.did,
      schemaType: 'AgeEligibilityCredential',
      claims: {
        fullName: 'Saksham Patwa',
        dateOfBirth: '2002-05-18', // Age 24
        countryOfBirth: 'IN',
        documentNumber: 'VR-CIVIL-89472',
      },
      expirationDays: 730,
    });

    const ageRecord: IssuedCredentialRecord = {
      id: ageIssued.credentialId,
      schemaType: 'AgeEligibilityCredential',
      schemaName: 'Age & Civil Eligibility Credential',
      holderDid: holderUser.did,
      holderEmail: holderUser.email,
      issuerDid: issuerVeritas.did,
      issuerName: issuerVeritas.name,
      issuanceDate: ageIssued.w3cPayload.issuanceDate,
      expirationDate: ageIssued.w3cPayload.expirationDate,
      claims: ageIssued.w3cPayload.credentialSubject,
      jwt: ageIssued.jwt,
      w3cPayload: ageIssued.w3cPayload,
      status: 'active',
    };

    const scholarshipIssued = await signVerifiableCredential({
      issuerDid: issuerFellowship.did,
      issuerName: issuerFellowship.name,
      holderDid: holderUser.did,
      schemaType: 'ScholarshipEligibilityCredential',
      claims: {
        beneficiaryName: 'Saksham Patwa',
        annualHouseholdIncome: 45000,
        gpa: 3.86,
        meritTier: 'Summa Cum Laude Candidate',
        academicYear: '2026-2027',
      },
      expirationDays: 180,
    });

    const scholarshipRecord: IssuedCredentialRecord = {
      id: scholarshipIssued.credentialId,
      schemaType: 'ScholarshipEligibilityCredential',
      schemaName: 'Scholarship Eligibility Credential',
      holderDid: holderUser.did,
      holderEmail: holderUser.email,
      issuerDid: issuerFellowship.did,
      issuerName: issuerFellowship.name,
      issuanceDate: scholarshipIssued.w3cPayload.issuanceDate,
      expirationDate: scholarshipIssued.w3cPayload.expirationDate,
      claims: scholarshipIssued.w3cPayload.credentialSubject,
      jwt: scholarshipIssued.jwt,
      w3cPayload: scholarshipIssued.w3cPayload,
      status: 'active',
    };

    this.credentials.set(studentRecord.id, studentRecord);
    this.credentials.set(ageRecord.id, ageRecord);
    this.credentials.set(scholarshipRecord.id, scholarshipRecord);

    // Seed default proof requests
    const proofReq1: ProofRequest = {
      id: 'req-verif-01',
      verifierDid: verifierUser.did,
      verifierName: 'Apex Global Financial Verification [Dev Partner]',
      purpose: 'Age and jurisdiction verification for international research fellowship grant',
      policy: {
        credentialType: 'AgeEligibilityCredential',
        allowedIssuers: [issuerVeritas.did],
        requiredAttributes: ['countryOfBirth'],
        predicates: [
          {
            attribute: 'dateOfBirth',
            operator: '>=',
            value: 18,
          },
        ],
      },
      nonce: crypto.randomBytes(16).toString('hex'),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      deepLink: `zeropass://proof-request?req=req-verif-01`,
    };

    const proofReq2: ProofRequest = {
      id: 'req-verif-02',
      verifierDid: verifierUser.did,
      verifierName: 'Apex Global Financial Verification [Dev Partner]',
      purpose: 'Verification of academic GPA >= 3.5 without revealing full grade transcript',
      policy: {
        credentialType: 'StudentStatusCredential',
        allowedIssuers: [issuerAethelgard.did],
        requiredAttributes: ['institution', 'enrollmentStatus'],
        predicates: [
          {
            attribute: 'gpa',
            operator: '>=',
            value: 3.5,
          },
        ],
      },
      nonce: crypto.randomBytes(16).toString('hex'),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      status: 'pending',
      deepLink: `zeropass://proof-request?req=req-verif-02`,
    };

    this.verificationRequests.set(proofReq1.id, proofReq1);
    this.verificationRequests.set(proofReq2.id, proofReq2);

    // Seed Developer API Keys
    const devKey: ApiKeyItem & { hashedSecret: string } = {
      id: 'key-dev-01',
      name: 'Core Verification Service Key',
      prefix: 'zp_live_9f82...',
      createdAt: '2026-02-10T14:30:00Z',
      lastUsedAt: '2026-10-24T12:05:00Z',
      environment: 'production',
      hashedSecret: crypto.createHash('sha256').update('zp_live_9f829a3b7c8e1d2f').digest('hex'),
    };
    this.apiKeys.set(devKey.id, devKey);

    // Seed Webhooks
    const webhook: WebhookConfig = {
      id: 'wh-01',
      url: 'https://api.apexcorp.com/v1/zeropass-webhooks',
      events: ['credential.presented', 'verification.completed', 'credential.revoked'],
      active: true,
      secret: 'whsec_7b8a1c920e54d6f83b2a',
      createdAt: '2026-02-12T10:00:00Z',
    };
    this.webhooks.set(webhook.id, webhook);

    // Seed recent audit logs
    this.auditLogs.push(
      {
        id: 'log-01',
        method: 'POST',
        endpoint: '/api/verifications',
        statusCode: 200,
        ip: '192.0.2.45',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        durationMs: 42,
        apiKeyPrefix: 'zp_live_9f82...',
      },
      {
        id: 'log-02',
        method: 'GET',
        endpoint: '/api/issuers',
        statusCode: 200,
        ip: '198.51.100.12',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        durationMs: 18,
      },
      {
        id: 'log-03',
        method: 'POST',
        endpoint: '/api/verification-requests',
        statusCode: 201,
        ip: '192.0.2.45',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        durationMs: 35,
        apiKeyPrefix: 'zp_live_9f82...',
      }
    );

    this.initialized = true;
  }
}

export const db = new DatabaseStore();
// Initialize immediately on server boot
db.init().catch(console.error);
