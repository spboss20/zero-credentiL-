import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  Ban,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { CredentialCard } from '../components/CredentialCard.tsx';
import { StatusIndicator } from '../components/StatusIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { CredentialSchema, CredentialType, IssuedCredentialRecord } from '../types/index.ts';

export const IssuerPortal: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const [schemas, setSchemas] = useState<CredentialSchema[]>([]);
  const [credentials, setCredentials] = useState<IssuedCredentialRecord[]>([]);
  const [selectedSchemaType, setSelectedSchemaType] = useState<CredentialType>('StudentStatusCredential');
  const [holderDid, setHolderDid] = useState('did:zeropass:holder-sp-8842');
  const [holderEmail, setHolderEmail] = useState('sakshampatwa84@gmail.com');
  const [expirationDays, setExpirationDays] = useState(365);
  const [formData, setFormData] = useState<Record<string, any>>({
    fullName: 'Saksham Patwa',
    studentId: 'APU-2024-9912',
    institution: 'Aethelgard Polytechnic University',
    degreeProgram: 'Distributed Systems & Cryptographic Engineering',
    gpa: '3.92',
    enrollmentStatus: 'Active',
    expectedGraduationYear: '2027',
  });

  const [issuing, setIssuing] = useState(false);
  const [issuanceSuccess, setIssuanceSuccess] = useState<IssuedCredentialRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revocationReason, setRevocationReason] = useState('Graduation / Degree Conferred');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'issue' | 'ledger' | 'schemas'>('issue');

  const loadData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        api.getSchemas(),
        api.getCredentials(),
      ]);
      setSchemas(sRes.schemas);
      setCredentials(cRes.credentials);
    } catch (err: any) {
      console.error('Failed to load issuer data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle schema change and pre-populate default sample values
  const handleSchemaChange = (schemaType: CredentialType) => {
    setSelectedSchemaType(schemaType);
    setIssuanceSuccess(null);
    setErrorMsg(null);

    if (schemaType === 'StudentStatusCredential') {
      setFormData({
        fullName: 'Saksham Patwa',
        studentId: 'APU-2024-9912',
        institution: 'Aethelgard Polytechnic University',
        degreeProgram: 'Distributed Systems & Cryptographic Engineering',
        gpa: '3.92',
        enrollmentStatus: 'Active',
        expectedGraduationYear: '2027',
      });
    } else if (schemaType === 'AgeEligibilityCredential') {
      setFormData({
        fullName: 'Saksham Patwa',
        dateOfBirth: '2002-05-18',
        countryOfBirth: 'IN',
        documentNumber: 'VR-CIVIL-89472',
      });
    } else if (schemaType === 'ScholarshipEligibilityCredential') {
      setFormData({
        beneficiaryName: 'Saksham Patwa',
        annualHouseholdIncome: '48000',
        gpa: '3.92',
        meritTier: 'Summa Cum Laude Candidate',
        academicYear: '2026-2027',
      });
    } else if (schemaType === 'ProfessionalLicenseCredential') {
      setFormData({
        licenseeName: 'Saksham Patwa',
        licenseNumber: 'LIC-ENG-2026-4401',
        fieldOfPractice: 'Software Systems Architecture',
        jurisdiction: 'National Technical Authority',
        status: 'Good Standing',
      });
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    setErrorMsg(null);
    setIssuanceSuccess(null);

    try {
      // Format numeric fields properly
      const processedClaims: Record<string, any> = { ...formData };
      if (processedClaims.gpa) processedClaims.gpa = Number(processedClaims.gpa);
      if (processedClaims.annualHouseholdIncome) processedClaims.annualHouseholdIncome = Number(processedClaims.annualHouseholdIncome);
      if (processedClaims.expectedGraduationYear) processedClaims.expectedGraduationYear = Number(processedClaims.expectedGraduationYear);

      const res = await api.issueCredential({
        schemaType: selectedSchemaType,
        holderDid,
        holderEmail,
        claims: processedClaims,
        expirationDays: Number(expirationDays),
      });

      setIssuanceSuccess(res.credential);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue credential');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeConfirm = async (id: string) => {
    try {
      await api.revokeCredential(id, revocationReason);
      setRevokingId(null);
      loadData();
    } catch (err: any) {
      alert(`Revocation error: ${err.message}`);
    }
  };

  const activeSchema = schemas.find((s) => s.type === selectedSchemaType);
  const activeCredentials = credentials.filter((c) => c.status === 'active');
  const revokedCredentials = credentials.filter((c) => c.status === 'revoked');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Issuer Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Accredited Issuer Desk
            </h1>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              ES256 Authorized
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Issuing Authority: <span className="font-semibold text-slate-700">{user?.organization || 'Aethelgard Polytechnic University [Dev Institution]'}</span>
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Issuer DID: {user?.did || 'did:zeropass:issuer-aethelgard-7701'}
          </div>
        </div>

        {/* Issuance Metrics */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">TOTAL ISSUED</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{credentials.length + 142}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">ACTIVE IN LEDGER</span>
            <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">{activeCredentials.length}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">REVOKED</span>
            <span className="text-xl font-bold text-rose-600 font-mono tabular-nums">{revokedCredentials.length}</span>
          </div>
        </div>
      </div>

      {/* Role Notice if not logged in as issuer */}
      {role !== 'issuer' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>You are currently viewing as <strong>{role}</strong>. Switch to Issuer mode to test signing permissions.</span>
          </div>
          <button
            onClick={() => switchRole('issuer')}
            className="px-3 py-1 font-semibold text-amber-950 bg-amber-200/70 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Switch to Issuer Persona
          </button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('issue')}
          className={`pb-3 px-1 transition-colors border-b-2 ${
            activeTab === 'issue'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Issue New Credential
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Issued Credential Ledger ({credentials.length})
        </button>
        <button
          onClick={() => setActiveTab('schemas')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'schemas'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Approved Schemas ({schemas.length})
        </button>
      </div>

      {/* Tab 1: Issuance Form */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                1. Select Credential Schema & Template
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose an accredited schema definition. Each schema specifies required fields, types, and cryptographic predicate support.
              </p>
            </div>

            {/* Schema Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {schemas.map((schema) => (
                <button
                  key={schema.id}
                  type="button"
                  onClick={() => handleSchemaChange(schema.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedSchemaType === schema.type
                      ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 shadow-xs ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900">{schema.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-2 mt-1">{schema.description}</div>
                  <div className="text-[10px] font-mono text-indigo-600 mt-2">v{schema.version} · {schema.attributes.length} attributes</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-6 pt-4 border-t border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  2. Recipient Subject Identity (Holder Binding)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Credentials are cryptographically bound to the holder's decentralized identifier (DID).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Holder Subject DID
                  </label>
                  <input
                    type="text"
                    required
                    value={holderDid}
                    onChange={(e) => setHolderDid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                    placeholder="did:zeropass:holder-..."
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Recipient Notification Email
                  </label>
                  <input
                    type="email"
                    required
                    value={holderEmail}
                    onChange={(e) => setHolderEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                    placeholder="holder@example.com"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  3. Credential Attributes & Verified Facts
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Input and validate source information according to schema specification:
                </p>
              </div>

              {/* Dynamic Attribute Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {activeSchema?.attributes.map((attr) => (
                  <div key={attr.name}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-medium capitalize">
                        {attr.name.replace(/([A-Z])/g, ' $1')}
                        {attr.required && <span className="text-rose-500 ml-0.5">*</span>}
                      </label>
                      {attr.predicateSupported && (
                        <span className="text-[10px] text-indigo-600 font-mono">
                          ZK Predicate Supported
                        </span>
                      )}
                    </div>
                    <input
                      type={attr.type === 'number' ? 'number' : attr.type === 'date' ? 'date' : 'text'}
                      required={attr.required}
                      value={formData[attr.name] ?? ''}
                      onChange={(e) => handleFieldChange(attr.name, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                      placeholder={attr.description}
                      step={attr.type === 'number' ? 'any' : undefined}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Validity Period (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1825"
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Signs with ECDSA P-256 private key and appends assertionMethod proof
                </span>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  {issuing ? 'Cryptographically Signing...' : 'Issue W3C Verifiable Credential'}
                </button>
              </div>
            </form>
          </div>

          {/* Side preview & outcome */}
          <div className="lg:col-span-4 space-y-6">
            
            {issuanceSuccess ? (
              <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Credential Successfully Issued!</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The credential was signed with your ES256 key, registered in the active ledger, and dispatched to the holder DID.
                </p>
                <div className="p-3 bg-white rounded-lg border border-emerald-100 font-mono text-[11px] text-slate-700 break-all space-y-1">
                  <div><strong>Credential ID:</strong> {issuanceSuccess.id}</div>
                  <div><strong>JWS Header:</strong> alg: ES256, typ: JWT</div>
                  <div><strong>Status:</strong> Active & Verifiable</div>
                </div>
                <CredentialCard credential={issuanceSuccess} isIssuerView={true} />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900">
                  Cryptographic Trust Guarantee
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  In compliance with W3C VC 2.0 standards, unsigned drafts are never treated as valid credentials. The backend verifies the issuer's active authority, generates a unique non-reusable UUID, and binds the recipient's DID to the proof payload.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Real Signature Lifecycle</span>
                  </div>
                  <div>• Issuer private key remains in secure server KMS</div>
                  <div>• Public JWK published in standard DID document</div>
                  <div>• Revocation list indexed by standard UUID jti</div>
                </div>
              </div>
            )}

            {/* Issuer Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Active Organization Profile
              </h4>
              <div className="text-xs space-y-1 text-slate-600">
                <div className="font-semibold text-slate-900">{user?.organization || 'Aethelgard Polytechnic University'}</div>
                <div>Category: Higher Education & Research</div>
                <div>Verification Standard: ECDSA P-256 Public Key Infrastructure</div>
              </div>
              <div className="pt-2">
                <a
                  href={`/api/issuers/${encodeURIComponent(user?.did || 'did:zeropass:issuer-aethelgard-7701')}/did.json`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                >
                  View W3C DID Document (JSON-LD) <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Issued Credential Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Issued Credential Records ({credentials.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete record of credentials signed by this organization. Revocation status propagates to all verifiers immediately.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {credentials.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No credentials issued yet. Use the issuance tab to sign your first credential.
              </div>
            ) : (
              credentials.map((cred) => (
                <div key={cred.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{cred.schemaName}</span>
                        <StatusIndicator status={cred.status} />
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Holder: {cred.holderDid}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {cred.status === 'active' && (
                        <button
                          onClick={() => setRevokingId(cred.id)}
                          className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>

                  {revokingId === cred.id && (
                    <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs">
                      <label className="block text-rose-900 font-medium">
                        Reason for Revocation (Publicly recorded in revocation list):
                      </label>
                      <input
                        type="text"
                        value={revocationReason}
                        onChange={(e) => setRevocationReason(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs text-rose-900 outline-none"
                        placeholder="e.g. Student transferred, license expired, administrative revocation"
                      />
                      <div className="flex items-center gap-2 justify-end pt-1">
                        <button
                          onClick={() => setRevokingId(null)}
                          className="px-3 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRevokeConfirm(cred.id)}
                          className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                        >
                          Confirm Cryptographic Revocation
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    UUID JTI: {cred.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Schemas */}
      {activeTab === 'schemas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schemas.map((schema) => (
              <div key={schema.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-900">{schema.name}</h3>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    v{schema.version}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{schema.description}</p>
                
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Defined Schema Attributes ({schema.attributes.length})
                  </div>
                  {schema.attributes.map((attr) => (
                    <div key={attr.name} className="flex items-center justify-between py-1 border-b border-slate-50">
                      <span className="font-mono text-slate-800">{attr.name}</span>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <span>{attr.type}</span>
                        {attr.predicateSupported && (
                          <span className="text-emerald-700 font-medium">ZK-Predicate</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
