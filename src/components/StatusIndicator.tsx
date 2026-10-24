import React from 'react';

export type StatusValue =
  | 'active'
  | 'revoked'
  | 'expired'
  | 'REVOKED'
  | 'EXPIRED'
  | 'VALID'
  | 'INVALID_SIGNATURE'
  | 'UNTRUSTED_ISSUER'
  | 'PREDICATE_FAILED'
  | 'verified'
  | 'pending'
  | 'presented'
  | 'rejected';

interface StatusIndicatorProps {
  status: StatusValue | string;
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, className = '' }) => {
  const getDisplay = () => {
    switch (status) {
      case 'active':
      case 'VALID':
      case 'verified':
        return {
          color: 'text-emerald-700',
          dot: 'bg-emerald-600',
          text: label || (status === 'VALID' ? 'Cryptographically Valid' : status === 'verified' ? 'Verified' : 'Active'),
        };
      case 'revoked':
      case 'REVOKED':
      case 'INVALID_SIGNATURE':
        return {
          color: 'text-rose-700',
          dot: 'bg-rose-600',
          text: label || (status === 'INVALID_SIGNATURE' ? 'Signature Invalid' : 'Revoked'),
        };
      case 'expired':
      case 'EXPIRED':
        return {
          color: 'text-amber-700',
          dot: 'bg-amber-600',
          text: label || 'Expired',
        };
      case 'UNTRUSTED_ISSUER':
        return {
          color: 'text-orange-700',
          dot: 'bg-orange-600',
          text: label || 'Untrusted Issuer',
        };
      case 'PREDICATE_FAILED':
        return {
          color: 'text-rose-700',
          dot: 'bg-rose-600',
          text: label || 'Predicate Failed',
        };
      case 'presented':
        return {
          color: 'text-indigo-700',
          dot: 'bg-indigo-600',
          text: label || 'Proof Presented',
        };
      case 'rejected':
        return {
          color: 'text-slate-600',
          dot: 'bg-slate-500',
          text: label || 'Rejected',
        };
      case 'pending':
      default:
        return {
          color: 'text-slate-600',
          dot: 'bg-slate-400',
          text: label || 'Pending Presentation',
        };
    }
  };

  const display = getDisplay();

  // Zero-pill discipline: unboxed text with subtle typographic dot accent, no candy badge wrappers
  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${display.color} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${display.dot}`} aria-hidden="true" />
      <span>{display.text}</span>
    </div>
  );
};
