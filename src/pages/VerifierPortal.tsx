import React, { useEffect, useState } from 'react';
import {
  FileCheck2,
  Plus,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { QrModal } from '../components/QrModal.tsx';
import { StatusIndicator } from '../components/StatusIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type {
  CredentialSchema,
  CredentialType,
  ProofRequest,
  TrustedIssuer,
  VerificationResult,
} from '../types/index.ts';

export const VerifierPortal: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const [issuers, setIssuers] = useState<TrustedIssuer[]>([]);
  const [schemas, setSchemas] = useState<CredentialSchema[]>([]);
  const [proofRequests, setProofRequests] = useState<ProofRequest[]>([]);
  const [selectedResult, setSelectedResult] = useState<VerificationResult | null>(null);

  // Policy creation form state
  const [purpose, setPurpose] = useState('Age verification for online service eligibility');
  const [selectedCredentialType, setSelectedCredentialType] = useState<CredentialType>('AgeEligibilityCredential');
  const [selectedIssuerDid, setSelectedIssuerDid] = useState<string>('');
  const [requiredAttributes, setRequiredAttributes] = useState<string[]>(['countryOfBirth']);
  const [predicates, setPredicates] = useState<{ attribute: string; operator: any; value: any }[]>([
    { attribute: 'dateOfBirth', operator: '>=', value: 18 },
  ]);

  const [creating, setCreating] = useState(false);
  const [activeQrModal, setActiveQrModal] = useState<ProofRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'requests' | 'audit'>('create');

  const loadData = async () => {
    try {
      const [iRes, sRes, rRes] = await Promise.all([
        api.getIssuers(),
        api.getSchemas(),
        api.getProofRequests(),
      ]);
      setIssuers(iRes.issuers);
      setSchemas(sRes.schemas);
      setProofRequests(rRes.requests);

      if (iRes.issuers.length > 0 && !selectedIssuerDid) {
        setSelectedIssuerDid(iRes.issuers[0].did);
      }
    } catch (err: any) {
      console.error('Failed to load verifier portal data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Update preset policy on credential type change
  const handleCredentialTypeChange = (type: CredentialType) => {
    setSelectedCredentialType(type);
    if (type === 'AgeEligibilityCredential') {
      setPurpose('Legal age verification without disclosing citizen ID or date of birth');
      setRequiredAttributes(['countryOfBirth']);
      setPredicates([{ attribute: 'dateOfBirth', operator: '>=', value: 18 }]);
      const civilIssuer = issuers.find((i) => i.supportedSchemas.includes('AgeEligibilityCredential'));
      if (civilIssuer) setSelectedIssuerDid(civilIssuer.did);
    } else if (type === 'StudentStatusCredential') {
      setPurpose('Academic student discount & enrollment verification');
      setRequiredAttributes(['institution', 'enrollmentStatus']);
      setPredicates([{ attribute: 'gpa', operator: '>=', value: 3.5 }]);
      const eduIssuer = issuers.find((i) => i.supportedSchemas.includes('StudentStatusCredential'));
      if (eduIssuer) setSelectedIssuerDid(eduIssuer.did);
    } else if (type === 'ScholarshipEligibilityCredential') {
      setPurpose('Needs-based scholarship eligibility determination');
      setRequiredAttributes(['meritTier']);
      setPredicates([
        { attribute: 'annualHouseholdIncome', operator: '<=', value: 300000 },
        { attribute: 'gpa', operator: '>=', value: 3.5 },
      ]);
      const fellowIssuer = issuers.find((i) => i.supportedSchemas.includes('ScholarshipEligibilityCredential'));
      if (fellowIssuer) setSelectedIssuerDid(fellowIssuer.did);
    } else if (type === 'ProfessionalLicenseCredential') {
      setPurpose('Active professional license verification for legal practice');
      setRequiredAttributes(['licenseNumber', 'fieldOfPractice', 'jurisdiction']);
      setPredicates([{ attribute: 'status', operator: '==', value: 'Good Standing' }]);
      const barIssuer = issuers.find((i) => i.supportedSchemas.includes('ProfessionalLicenseCredential'));
      if (barIssuer) setSelectedIssuerDid(barIssuer.did);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const allowedIssuers = selectedIssuerDid
        ? [selectedIssuerDid]
        : issuers.filter((i) => i.supportedSchemas.includes(selectedCredentialType)).map((i) => i.did);

      const res = await api.createProofRequest({
        purpose,
        policy: {
          credentialType: selectedCredentialType,
          allowedIssuers,
          requiredAttributes,
          predicates,
        },
      });

      setActiveQrModal(res.request);
      loadData();
      setActiveTab('requests');
    } catch (err: any) {
      alert(`Error creating proof request: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Simulate wallet presentation & immediate server audit
  const handleSimulatePresentation = async (req: ProofRequest) => {
    try {
      // Find a matching credential
      const credsRes = await api.getCredentials();
      const match = credsRes.credentials.find(
        (c) => c.schemaType === req.policy.credentialType
      );

      if (!match) {
        alert(`No credential of type ${req.policy.credentialType} found in database. Issue one in the Issuer Desk first.`);
        return;
      }

      const res = await api.submitVerification({
        requestId: req.id,
        credentialId: match.id,
        disclosedAttributes: req.policy.requiredAttributes,
      });

      setSelectedResult(res.result);
      setActiveTab('audit');
      loadData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const activeSchema = schemas.find((s) => s.type === selectedCredentialType);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Verifier & Proof Evaluation Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Verifier Entity: <span className="font-semibold text-slate-700">{user?.organization || 'Apex Global Financial Verification [Dev Partner]'}</span>
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Verifier DID: {user?.did || 'did:zeropass:verifier-apex-3321'}
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">REGISTERED POLICIES</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{proofRequests.length}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">TRUSTED ISSUERS</span>
            <span className="text-xl font-bold text-indigo-600 font-mono tabular-nums">{issuers.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-1 transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Create Verification Policy
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Proof Requests ({proofRequests.length})
        </button>
        {selectedResult && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 transition-colors border-b-2 text-emerald-600 ${
              activeTab === 'audit'
                ? 'border-emerald-600 font-bold'
                : 'border-transparent hover:text-emerald-800'
            }`}
          >
            Cryptographic Audit Report
          </button>
        )}
      </div>

      {/* Tab 1: Create Policy Form */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                1. Select Target Credential Standard
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure which credential type is required from the presenter:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {schemas.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleCredentialTypeChange(s.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedCredentialType === s.type
                      ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{s.description}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-6 pt-4 border-t border-slate-100">
              <div className="text-xs space-y-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Verification Purpose (Presented to Holder for consent)
                  </label>
                  <input
                    type="text"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Authorized Issuing Authority (DID Trust Anchor)
                  </label>
                  <select
                    value={selectedIssuerDid}
                    onChange={(e) => setSelectedIssuerDid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
                  >
                    {issuers.map((iss) => (
                      <option key={iss.did} value={iss.did}>
                        {iss.name} ({iss.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selective Disclosure Attributes */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      Selective Disclosure Requirements
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Uncheck attributes you do not strictly require
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeSchema?.attributes.map((attr) => {
                      const isChecked = requiredAttributes.includes(attr.name);
                      return (
                        <label
                          key={attr.name}
                          className="flex items-center gap-2 p-2 rounded bg-white border border-slate-200 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRequiredAttributes([...requiredAttributes, attr.name]);
                              } else {
                                setRequiredAttributes(requiredAttributes.filter((a) => a !== attr.name));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 font-mono text-[11px] truncate">{attr.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Predicate Rule */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      Zero-Knowledge Predicate Eligibility Rule
                    </span>
                    <span className="text-[11px] text-indigo-600 font-mono">
                      Mathematical inequality evaluation
                    </span>
                  </div>

                  {predicates.map((pred, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        readOnly
                        value={pred.attribute}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700"
                      />
                      <select
                        value={pred.operator}
                        onChange={(e) => {
                          const updated = [...predicates];
                          updated[idx].operator = e.target.value as any;
                          setPredicates(updated);
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700"
                      >
                        <option value=">=">&gt;= (Greater or equal)</option>
                        <option value="<=">&lt;= (Less or equal)</option>
                        <option value=">">&gt; (Strictly greater)</option>
                        <option value="<">&lt; (Strictly less)</option>
                        <option value="==">== (Exact match)</option>
                      </select>
                      <input
                        type="text"
                        value={pred.value}
                        onChange={(e) => {
                          const updated = [...predicates];
                          updated[idx].value = e.target.value;
                          setPredicates(updated);
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-700 font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Generates cryptographic nonce and standards-compliant QR pairing link
                </span>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  {creating ? 'Generating Request...' : 'Generate Proof Request & QR'}
                </button>
              </div>
            </form>
          </div>

          {/* Side Info & Specifications */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Server-Side Cryptographic Verifier
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ZeroPass never trusts client-side statements or boolean flags. Every presentation triggers an independent server verification that validates:
              </p>
              <ul className="text-xs space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>ECDSA P-256 Signature:</strong> Verifies token was signed by the issuer's private key.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Revocation Registry:</strong> Queries live revocation status to ensure credential is still active.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Predicate Computation:</strong> Evaluates arithmetic bounds on genuine signed values.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Nonce Anti-Replay:</strong> Confirms presentation answers a fresh challenge.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Requests List */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {proofRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900">{req.purpose}</h3>
                    <StatusIndicator status={req.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Credential: <span className="font-semibold text-slate-700">{req.policy.credentialType}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveQrModal(req)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Display QR
                  </button>
                  <button
                    onClick={() => handleSimulatePresentation(req)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    Simulate Presentation & Verify
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">DISCLOSED ATTRIBUTES</span>
                  <span className="text-slate-800">
                    {req.policy.requiredAttributes.length > 0
                      ? req.policy.requiredAttributes.join(', ')
                      : 'None (Pure Zero-Knowledge presentation)'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">PREDICATE CONSTRAINTS</span>
                  <span className="text-slate-800 font-mono text-[11px]">
                    {req.policy.predicates.map((p) => `${p.attribute} ${p.operator} ${p.value}`).join(' & ')}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Nonce: {req.nonce} · ID: {req.id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Detailed Cryptographic Audit Report */}
      {activeTab === 'audit' && selectedResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-8 shadow-xs">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold text-slate-900">
                  Cryptographic Verification Result
                </span>
                <StatusIndicator status={selectedResult.status} />
              </div>
              <p className="text-xs text-slate-500">
                Audit conducted by ZeroPass verification engine at {new Date(selectedResult.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-500">
              <div>REPORT ID: {selectedResult.id}</div>
              <div>REQUEST: {selectedResult.requestId}</div>
            </div>
          </div>

          {/* Verification Checks Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Cryptographic Invariants & Policy Checks
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedResult.checks).map(([key, check]) => (
                <div
                  key={key}
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    check.passed ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {check.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-900">{check.name}</div>
                    <div className="text-slate-600">{check.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclosed Claims & Verified Predicates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Selectively Disclosed Attributes ({Object.keys(selectedResult.disclosedClaims).length})
              </h4>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                {Object.keys(selectedResult.disclosedClaims).length === 0 ? (
                  <div className="text-slate-500 italic">
                    Zero raw attributes were disclosed. All eligibility was verified mathematically.
                  </div>
                ) : (
                  Object.entries(selectedResult.disclosedClaims).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1 border-b border-slate-200/50 last:border-0">
                      <span className="text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-mono font-medium text-slate-900">{String(v)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Evaluated Predicate Outcomes
              </h4>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                {selectedResult.verifiedPredicates.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0">
                    <span className="font-mono text-slate-700">{p.condition}</span>
                    <span className={`font-semibold ${p.satisfied ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {p.satisfied ? '✓ Satisfied' : '✗ Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* QR Modal */}
      {activeQrModal && (
        <QrModal
          title="Verification Proof Request"
          subtitle={`Present a compatible ${activeQrModal.policy.credentialType}`}
          deepLink={activeQrModal.deepLink}
          onClose={() => setActiveQrModal(null)}
          onSimulateHolderPresent={() => {
            setActiveQrModal(null);
            handleSimulatePresentation(activeQrModal);
          }}
        />
      )}

    </div>
  );
};
