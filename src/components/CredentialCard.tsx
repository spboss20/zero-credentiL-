import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Key, Calendar, Ban, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { IssuedCredentialRecord } from '../types/index.ts';
import { RawJwtModal } from './RawJwtModal.tsx';
import { StatusIndicator } from './StatusIndicator.tsx';

interface CredentialCardProps {
  credential: IssuedCredentialRecord;
  isIssuerView?: boolean;
  onRevoke?: (id: string) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  isIssuerView = false,
  onRevoke,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showRawModal, setShowRawModal] = useState(false);
  const [hiddenAttributes, setHiddenAttributes] = useState<Record<string, boolean>>({
    nationalId: true,
    documentNumber: true,
    annualHouseholdIncome: false,
  });

  const toggleAttributeHide = (key: string) => {
    setHiddenAttributes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const formattedDate = new Date(credential.issuanceDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedExp = credential.expirationDate
    ? new Date(credential.expirationDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'No Expiration';

  return (
    <>
      <div className={`bg-white rounded-xl border transition-all ${
        credential.status === 'revoked'
          ? 'border-rose-200 bg-rose-50/20'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      }`}>
        
        {/* Card Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {credential.schemaName}
                </h3>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>Issued by {credential.issuerName}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[120px]" title={credential.issuerDid}>
                  {credential.issuerDid.slice(0, 18)}...
                </span>
              </div>
            </div>

            <StatusIndicator status={credential.status} />
          </div>

          {/* Quick summary strip */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">ISSUED</span>
              <span className="text-slate-700 font-medium">{formattedDate}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">EXPIRATION</span>
              <span className="text-slate-700 font-medium">{formattedExp}</span>
            </div>
          </div>
        </div>

        {/* Claims View */}
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Signed Credential Attributes ({Object.keys(credential.claims).length})
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              {expanded ? 'Collapse' : 'Inspect Claims'}
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Primary preview attributes */}
          <div className="space-y-1.5">
            {Object.entries(credential.claims)
              .filter(([k]) => k !== 'id')
              .slice(0, expanded ? undefined : 3)
              .map(([key, val]) => {
                const isHidden = hiddenAttributes[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1 border-b border-slate-200/50 last:border-0"
                  >
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 font-mono text-xs">
                        {isHidden ? '••••••••••••' : String(val)}
                      </span>
                      {['dateOfBirth', 'nationalId', 'documentNumber', 'annualHouseholdIncome'].includes(key) && (
                        <button
                          onClick={() => toggleAttributeHide(key)}
                          className="text-slate-400 hover:text-slate-600 p-0.5"
                          title={isHidden ? 'Reveal attribute' : 'Mask attribute'}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {credential.status === 'revoked' && credential.revocationReason && (
            <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
              <span className="font-semibold">Revocation Notice:</span> {credential.revocationReason} ({credential.revocationDate?.slice(0, 10)})
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => setShowRawModal(true)}
            className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-slate-400" />
            Inspect ES256 Signature
          </button>

          {isIssuerView && credential.status === 'active' && onRevoke && (
            <button
              onClick={() => onRevoke(credential.id)}
              className="text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              Revoke Credential
            </button>
          )}
        </div>

      </div>

      {showRawModal && (
        <RawJwtModal
          credential={credential}
          onClose={() => setShowRawModal(false)}
        />
      )}
    </>
  );
};
