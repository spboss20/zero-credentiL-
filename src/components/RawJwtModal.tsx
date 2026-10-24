import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check } from 'lucide-react';
import { api } from '../services/api.ts';
import type { IssuedCredentialRecord } from '../types/index.ts';

interface RawJwtModalProps {
  credential: IssuedCredentialRecord;
  onClose: () => void;
}

export const RawJwtModal: React.FC<RawJwtModalProps> = ({ credential, onClose }) => {
  const [activeTab, setActiveTab] = useState<'decoded' | 'raw' | 'verify'>('decoded');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Decode JWT parts
  const parts = credential.jwt.split('.');
  let headerJson = {};
  let payloadJson = {};
  try {
    headerJson = JSON.parse(atob(parts[0]));
    payloadJson = JSON.parse(atob(parts[1]));
  } catch {
    // fallback
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(credential.jwt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyRawJwt(credential.jwt);
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ valid: false, error: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Cryptographic Token Inspector (W3C VC JWT)
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-md">
              {credential.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('decoded')}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'decoded'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Decoded Payload & Claims
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'raw'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Raw JWS Token
          </button>
          <button
            onClick={() => {
              setActiveTab('verify');
              if (!verificationResult) handleRunVerify();
            }}
            className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'verify'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Server Cryptographic Audit
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
          {activeTab === 'decoded' && (
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1 font-sans">
                  Protected JOSE Header (ES256 ECDSA P-256)
                </div>
                <pre className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(headerJson, null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1 font-sans">
                  W3C Verifiable Credential Payload & Subject Claims
                </div>
                <pre className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-200 overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(payloadJson, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between font-sans">
                <span className="text-xs text-slate-600">Standard RFC 7519 Compact Serialization:</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy JWT'}
                </button>
              </div>
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg break-all text-[11px] leading-relaxed select-all">
                <span className="text-rose-400">{parts[0]}</span>
                <span className="text-slate-500">.</span>
                <span className="text-indigo-300">{parts[1]}</span>
                <span className="text-slate-500">.</span>
                <span className="text-emerald-400">{parts[2]}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Color legend: <span className="text-rose-600 font-semibold">Header</span> · <span className="text-indigo-600 font-semibold">W3C Payload</span> · <span className="text-emerald-600 font-semibold">Cryptographic Signature</span>
              </p>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="space-y-4 font-sans">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900">
                    Live Server-Side Signature Audit
                  </span>
                  <button
                    onClick={handleRunVerify}
                    disabled={verifying}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                  >
                    {verifying ? 'Verifying...' : 'Re-verify Signature'}
                  </button>
                </div>

                {verificationResult ? (
                  <div className="space-y-3 mt-3">
                    <div className="flex items-center gap-2">
                      {verificationResult.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {verificationResult.valid
                            ? 'Cryptographic Signature Valid & Unaltered'
                            : `Verification Failed: ${verificationResult.status}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Verified against issuer public key via ECDSA P-256 algorithm
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200 pt-2 font-mono">
                      <div>
                        <span className="text-slate-400 block text-[10px]">ISSUER DID</span>
                        <span className="text-slate-800 text-[11px] truncate block">{verificationResult.issuer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">HOLDER SUBJECT DID</span>
                        <span className="text-slate-800 text-[11px] truncate block">{verificationResult.subject}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 py-4 text-center">
                    Running cryptographic validation against issuer JWK...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>W3C Verifiable Credentials Data Model v2.0 Compliant</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
