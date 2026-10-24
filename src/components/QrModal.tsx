import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Check, Smartphone, ExternalLink } from 'lucide-react';

interface QrModalProps {
  title: string;
  subtitle: string;
  deepLink: string;
  onClose: () => void;
  onSimulateHolderPresent?: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  title,
  subtitle,
  deepLink,
  onClose,
  onSimulateHolderPresent,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4">
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {subtitle}
          </p>

          <div className="inline-block p-4 bg-white rounded-xl border border-slate-200 shadow-xs mx-auto">
            <QRCodeSVG
              value={deepLink}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-left">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>Standard Deep Link URI</span>
              <button
                onClick={handleCopy}
                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-[11px] font-mono text-slate-700 break-all select-all">
              {deepLink}
            </p>
          </div>

          {onSimulateHolderPresent && (
            <div className="pt-2">
              <button
                onClick={onSimulateHolderPresent}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
              >
                Connect Holder Wallet & Submit Presentation
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Simulates real wallet cryptographic response with selective disclosure
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <span className="text-[11px] text-slate-500">
            Compatible with W3C VC, OpenID4VP, and Privado ID compatible wallets
          </span>
        </div>

      </div>
    </div>
  );
};
