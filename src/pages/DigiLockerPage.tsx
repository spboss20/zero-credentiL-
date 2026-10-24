import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const DigiLockerPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [docType, setDocType] = useState('10TH_MARKSHEET');
  const [orgId] = useState('CBSE-001');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    api.getDigiLockerStatus().then(setStatusData).catch(console.error);
  }, []);

  const handleTestSchema = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.validateDigiLockerSchema(docType, orgId);
      setTestResult(res);
    } catch (err: any) {
      alert(`Schema test error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <span>National Digital Infrastructure Specification</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          DigiLocker & API Setu Integration Architecture
        </h1>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          ZeroPass implements a dedicated provider bridge for the Ministry of Electronics and Information Technology (MeitY) DigiLocker and API Setu ecosystem conforming to the National Data Governance Framework.
        </p>
      </div>

      {/* Production Sandbox Notice */}
      <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Status: Production Gateway Disabled · Integration Architecture Ready</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          To protect citizen privacy, ZeroPass strictly adheres to MeitY security guidelines: we never scrape DigiLocker web interfaces, never ask users for DigiLocker passwords, and never fabricate a fake government OAuth screen. Production activation requires approved NeGD partner agreements and whitelisted mTLS certificates.
        </p>
      </div>

      {/* 3-Stage Lifecycle Explanation */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          The 3-Stage Pipeline: From Government Document to Privacy-Preserving VC
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <span className="text-xs font-mono font-bold text-indigo-600 block">STAGE 01</span>
            <h3 className="font-semibold text-sm text-slate-900">Document Retrieval</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Via MeriPehchan OAuth 2.0 with explicit citizen consent, the gateway fetches the canonical XML/PDF certificate issued by the government board (e.g. CBSE, MoRTH, UIDAI).
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <span className="text-xs font-mono font-bold text-indigo-600 block">STAGE 02</span>
            <h3 className="font-semibold text-sm text-slate-900">Issuer Trust Validation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The engine validates the X.509 digital signature embedded inside the government XML document against the National Root CA certificate chain, proving document authenticity and non-tampering.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <span className="text-xs font-mono font-bold text-indigo-600 block">STAGE 03</span>
            <h3 className="font-semibold text-sm text-slate-900">W3C VC Transformation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ZeroPass converts the authenticated facts into a privacy-preserving W3C Verifiable Credential. The citizen can now prove eligibility predicates (e.g. "passed exam", "over 18") without exposing their Aadhaar or registration numbers.
            </p>
          </div>
        </div>
      </div>

      {/* Live Integration Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              MeitY / API Setu Production Checklist
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current compliance status of the ZeroPass integration environment
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 font-mono">
            OAuth 2.0 / MeriPehchan Spec
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {statusData?.checklist?.map((item: any, idx: number) => (
            <div key={idx} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-slate-900">{item.item}</div>
                <div className="text-slate-500 text-[11px]">{item.requirement}</div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`font-mono text-[11px] font-semibold ${
                  item.status === 'READY_IN_ARCHITECTURE'
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}>
                  {item.status.replace(/_/g, ' ')}
                </span>
                <a
                  href={item.officialRef}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-indigo-600 p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schema Tester */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900">
          API Setu Document Pull URI Simulator
        </h3>
        <p className="text-xs text-slate-500">
          Test document taxonomy compliance according to National DigiLocker XML specifications:
        </p>

        <form onSubmit={handleTestSchema} className="flex flex-col sm:flex-row gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="10TH_MARKSHEET">Secondary School Examination Certificate (10th)</option>
            <option value="12TH_MARKSHEET">Senior School Certificate Examination (12th)</option>
            <option value="DRIVING_LICENSE">Ministry of Road Transport Driving License</option>
            <option value="AADHAAR_VERIFIED_NAME">Aadhaar Verified Identity Assertion</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            Validate Pull Schema
          </button>
        </form>

        {testResult && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
            <div className="text-emerald-700 font-semibold">✓ {testResult.recommendation}</div>
            <div className="text-slate-600 text-[11px]">Canonical URI: {testResult.samplePullUri}</div>
          </div>
        )}
      </div>

    </div>
  );
};
