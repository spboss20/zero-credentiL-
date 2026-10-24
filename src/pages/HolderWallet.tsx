import React, { useEffect, useState } from 'react';
import {
  Wallet,
  ShieldCheck,
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Lock,
  History,
  QrCode,
  FileCheck2,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { CredentialCard } from '../components/CredentialCard.tsx';
import { QrModal } from '../components/QrModal.tsx';
import { StatusIndicator } from '../components/StatusIndicator.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { IssuedCredentialRecord, PresentationRecord, ProofRequest, VerificationResult } from '../types/index.ts';

export const HolderWallet: React.FC = () => {
  const { user, role, switchRole } = useAuth();
  const [credentials, setCredentials] = useState<IssuedCredentialRecord[]>([]);
  const [proofRequests, setProofRequests] = useState<ProofRequest[]>([]);
  const [history, setHistory] = useState<PresentationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification request consent modal state
  const [selectedRequest, setSelectedRequest] = useState<ProofRequest | null>(null);
  const [submittingPresentation, setSubmittingPresentation] = useState(false);
  const [presentationOutcome, setPresentationOutcome] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'credentials' | 'requests' | 'history'>('credentials');
  const [activeQrModal, setActiveQrModal] = useState<ProofRequest | null>(null);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const [cRes, rRes, hRes] = await Promise.all([
        api.getCredentials({ holderDid: user?.did }),
        api.getProofRequests(),
        api.getPresentationHistory(),
      ]);
      setCredentials(cRes.credentials);
      setProofRequests(rRes.requests);
      setHistory(hRes.presentations);
    } catch (err: any) {
      console.error('Wallet load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, [user]);

  // Handle presenting credential to verifier
  const handleApprovePresentation = async (req: ProofRequest) => {
    setSubmittingPresentation(true);
    setPresentationOutcome(null);

    // Find a matching credential for the requested type
    const matchingCred = credentials.find(
      (c) => c.schemaType === req.policy.credentialType && c.status === 'active'
    );

    if (!matchingCred) {
      alert(`No active '${req.policy.credentialType}' credential found in your wallet.`);
      setSubmittingPresentation(false);
      return;
    }

    try {
      const res = await api.submitVerification({
        requestId: req.id,
        credentialId: matchingCred.id,
        disclosedAttributes: req.policy.requiredAttributes,
      });

      setPresentationOutcome(res.result);
      loadWallet();
    } catch (err: any) {
      alert(`Presentation failed: ${err.message}`);
    } finally {
      setSubmittingPresentation(false);
    }
  };

  const pendingRequests = proofRequests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Wallet Identity Hero */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Personal Identity Vault
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Holder: <span className="font-semibold text-slate-700">{user?.name || 'Saksham Patwa'}</span> ({user?.email || 'sakshampatwa84@gmail.com'})
          </p>
          <div className="text-[11px] font-mono text-slate-400">
            Self-Sovereign DID: {user?.did || 'did:zeropass:holder-sp-8842'}
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">CREDENTIALS</span>
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{credentials.length}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">PENDING REQUESTS</span>
            <span className="text-xl font-bold text-indigo-600 font-mono tabular-nums">{pendingRequests.length}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">PRESENTATIONS</span>
            <span className="text-xl font-bold text-slate-700 font-mono tabular-nums">{history.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('credentials')}
          className={`pb-3 px-1 transition-colors border-b-2 ${
            activeTab === 'credentials'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          My Credentials ({credentials.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Pending Verification Requests</span>
          {pendingRequests.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Presentation Audit Log ({history.length})
        </button>
      </div>

      {/* Tab 1: Credentials List */}
      {activeTab === 'credentials' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Each credential is cryptographically signed with ECDSA P-256 and stored securely under your control.
            </p>
          </div>

          {credentials.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-900">Your wallet is empty</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No credentials issued to your DID yet. Switch to the Issuer Desk to issue sample Student or Age credentials.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {credentials.map((cred) => (
                <CredentialCard key={cred.id} credential={cred} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Proof Requests Inbox */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <p className="text-xs text-slate-500">
            External organizations requesting verification. You review the exact attributes requested and approve presentation with selective disclosure.
          </p>

          {proofRequests.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-semibold text-slate-900">No active proof requests</div>
              <p className="text-xs text-slate-500">
                You can create a new proof request in the Verifier Portal to test the presentation flow.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {proofRequests.map((req) => {
                const matchingCred = credentials.find(
                  (c) => c.schemaType === req.policy.credentialType && c.status === 'active'
                );

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-slate-900">{req.verifierName}</h3>
                          <StatusIndicator status={req.status} />
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{req.purpose}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveQrModal(req)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          View QR Code
                        </button>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                          >
                            Review & Present
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">REQUESTED CREDENTIAL</span>
                        <span className="font-semibold text-slate-800">{req.policy.credentialType}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">DISCLOSED ATTRIBUTES</span>
                        <span className="text-slate-700">
                          {req.policy.requiredAttributes.length > 0
                            ? req.policy.requiredAttributes.join(', ')
                            : 'None (Zero attribute disclosure)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block font-medium">PREDICATES TO PROVE</span>
                        <span className="text-slate-700 font-mono text-[11px]">
                          {req.policy.predicates.map((p) => `${p.attribute} ${p.operator} ${p.value}`).join(' & ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Request ID: {req.id}</span>
                      <span>Expires: {new Date(req.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Presentation History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">
              Presentation History & Selective Disclosures ({history.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable record of every presentation made by your wallet. Only minimal disclosure receipts are retained.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {history.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No presentation receipts yet.
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">{item.verifierName}</div>
                    <StatusIndicator status={item.verificationStatus} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600">
                    <div><strong>Credential:</strong> {item.credentialType}</div>
                    <div><strong>Disclosed Attributes:</strong> {item.disclosedAttributes.join(', ') || 'None (ZK Proof only)'}</div>
                    <div><strong>Predicates:</strong> {item.predicatesProven.join(', ') || 'Direct claim verification'}</div>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Presented: {new Date(item.timestamp).toLocaleString()} · ID: {item.id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Review & Present with Selective Disclosure Consent */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Consent & Presentation</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setPresentationOutcome(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                <strong>{selectedRequest.verifierName}</strong> has requested proof of eligibility for the following purpose:
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 italic">
                "{selectedRequest.purpose}"
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Selective Disclosure Policy
                </div>
                
                <div>
                  <span className="text-slate-500 block mb-1">Attributes to be shared with verifier:</span>
                  {selectedRequest.policy.requiredAttributes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRequest.policy.requiredAttributes.map((attr) => (
                        <span key={attr} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">
                          {attr}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      Zero attributes will be disclosed. Only mathematical predicate validity is sent.
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block mb-1">Mathematical Predicates Evaluated:</span>
                  <div className="space-y-1 font-mono text-[11px] text-slate-800">
                    {selectedRequest.policy.predicates.map((p) => (
                      <div key={p.attribute} className="p-1.5 bg-slate-50 rounded border border-slate-100">
                        {p.attribute} {p.operator} {p.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Presentation Outcome Report if verified */}
              {presentationOutcome && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Presentation Verified by Server!</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Status: <strong className="text-emerald-700">{presentationOutcome.status}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Audit ID: {presentationOutcome.id}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setPresentationOutcome(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprovePresentation(selectedRequest)}
                disabled={submittingPresentation}
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {submittingPresentation ? 'Signing Presentation...' : 'Authorize & Sign Presentation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal for scanning with mobile or deep link */}
      {activeQrModal && (
        <QrModal
          title="Scan to Verify in Mobile Wallet"
          subtitle={`Verification request from ${activeQrModal.verifierName}`}
          deepLink={activeQrModal.deepLink}
          onClose={() => setActiveQrModal(null)}
          onSimulateHolderPresent={() => {
            setActiveQrModal(null);
            handleApprovePresentation(activeQrModal);
          }}
        />
      )}

    </div>
  );
};
