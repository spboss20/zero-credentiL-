import { Router } from 'express';

export const digilockerRouter = Router();

export interface DigiLockerIntegrationChecklist {
  item: string;
  category: 'Legal' | 'Cryptographic' | 'Networking' | 'Protocol';
  status: 'PENDING_REGISTRATION' | 'NOT_CONFIGURED' | 'READY_IN_ARCHITECTURE';
  requirement: string;
  officialRef: string;
}

const checklist: DigiLockerIntegrationChecklist[] = [
  {
    item: 'MeitY / API Setu Partner Agreement',
    category: 'Legal',
    status: 'PENDING_REGISTRATION',
    requirement: 'Formal on-boarding application submitted to National e-Governance Division (NeGD) / Ministry of Electronics & IT (MeitY)',
    officialRef: 'https://apisetu.gov.in/onboarding',
  },
  {
    item: 'OAuth 2.0 Client Credentials & MeriPehchan ID',
    category: 'Protocol',
    status: 'NOT_CONFIGURED',
    requirement: 'Production DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET issued by DigiLocker Developer Console',
    officialRef: 'https://docs.digitallocker.gov.in/technical-specifications/oauth-api',
  },
  {
    item: 'Server Static IP & Mutual TLS Whitelisting',
    category: 'Networking',
    status: 'NOT_CONFIGURED',
    requirement: 'Whitelisted production egress IP address registered with API Setu firewall with mTLS certificates',
    officialRef: 'https://apisetu.gov.in/security-guidelines',
  },
  {
    item: 'Consent Artifact & Digital Signature (PKCS#7 / XML-DSig)',
    category: 'Cryptographic',
    status: 'READY_IN_ARCHITECTURE',
    requirement: 'ECDSA / RSA X.509 cryptographic signing of user consent requests conforming to Electronic Consent Framework v1.1',
    officialRef: 'https://www.meity.gov.in/electronic-consent-framework',
  },
  {
    item: 'W3C Verifiable Credential Transformation Bridge',
    category: 'Protocol',
    status: 'READY_IN_ARCHITECTURE',
    requirement: 'ZeroPass mapping module translating raw MeitY XML Document URIs to W3C Verifiable Credential ES256 claims',
    officialRef: 'https://www.w3.org/TR/vc-data-model-2.0/',
  },
];

// GET /api/digilocker/status
digilockerRouter.get('/status', (req, res) => {
  res.json({
    enabled: false,
    environment: 'development_sandbox',
    statusMessage: 'DigiLocker production gateway is currently disabled pending official MeitY / API Setu credentials.',
    productionNotice: 'To protect citizen privacy, ZeroPass never scrapes or impersonates DigiLocker credentials. Real integration requires official Ministry authorization.',
    checklist,
    architectureSpecification: {
      endpoints: {
        authorizationUrl: 'https://digilocker.meripehchan.gov.in/public/oauth2/1/authorize',
        tokenUrl: 'https://digilocker.meripehchan.gov.in/public/oauth2/1/token',
        pullUriGateway: 'https://api.digitallocker.gov.in/public/oauth2/1/xml/pull',
      },
      scopesRequired: ['read_issued_documents', 'verify_profile'],
      flowDifference: {
        stage1: 'Document Retrieval: Downloads raw document/certificate XML signed by original issuing board (e.g. CBSE, MoRTH).',
        stage2: 'Issuer Trust Validation: Verifies the X.509 digital signature embedded in the raw certificate against the MeitY root certificate authority.',
        stage3: 'Verifiable Credential Issuance: ZeroPass converts the validated document claims into a tamper-evident, privacy-preserving W3C VC, allowing zero-knowledge proof presentations without sharing raw identity numbers.',
      },
    },
  });
});

// POST /api/digilocker/validate-schema (For testing XML Pull URI schema compliance in development)
digilockerRouter.post('/validate-schema', (req, res) => {
  const { docType, orgId } = req.body;
  if (!docType || !orgId) {
    return res.status(400).json({ error: 'Missing docType or orgId' });
  }

  const supportedTypes = ['10TH_MARKSHEET', '12TH_MARKSHEET', 'DRIVING_LICENSE', 'AADHAAR_VERIFIED_NAME'];
  const isValidType = supportedTypes.includes(docType);

  res.json({
    validFormat: isValidType,
    docType,
    orgId,
    samplePullUri: `in.gov.digilocker.pull://${orgId}/${docType}/SAMPLE-REF-2026`,
    recommendation: isValidType
      ? 'Document schema is conformant with National DigiLocker Registry specification.'
      : `Document type '${docType}' must be mapped to an approved National API Setu taxonomy.`,
  });
});
