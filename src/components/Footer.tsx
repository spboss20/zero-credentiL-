import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ExternalLink, Lock, FileCode, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">ZeroPass</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Decentralized verifiable identity infrastructure. Privacy-first credentials, selective disclosure, and zero-knowledge verification.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard ES256 / P-256 Signatures</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/wallet" className="hover:text-indigo-600 transition-colors">Holder Wallet & Consent</Link>
              </li>
              <li>
                <Link to="/issuer" className="hover:text-indigo-600 transition-colors">Issuer Portal & Schemas</Link>
              </li>
              <li>
                <Link to="/verifier" className="hover:text-indigo-600 transition-colors">Verifier Policy & Audits</Link>
              </li>
              <li>
                <Link to="/directory" className="hover:text-indigo-600 transition-colors">Trusted Issuer Registry</Link>
              </li>
              <li>
                <Link to="/developer" className="hover:text-indigo-600 transition-colors">Developer Console & Keys</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Standards & Specs
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a
                  href="https://www.w3.org/TR/vc-data-model-2.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                >
                  W3C VC Data Model 2.0 <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.privado.id/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                >
                  Privado ID Protocol Reference <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <Link to="/digilocker" className="hover:text-indigo-600 transition-colors">
                  DigiLocker / MeitY Architecture
                </Link>
              </li>
              <li>
                <Link to="/docs" className="hover:text-indigo-600 transition-colors">
                  ZeroPass Cryptographic Specification
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Cryptographic Integrity
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              ZeroPass never fabricates verification results. All signatures are verified server-side with standard JOSE ES256 and evaluated against strict mathematical predicates.
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Server status: Online · Port 3000
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center gap-2">
            <span>© 2026 ZeroPass Identity Infrastructure</span>
            <span aria-hidden="true">·</span>
            <span>All seed issuers are designated for development evaluation</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/docs" className="hover:text-slate-800">API Documentation</Link>
            <span aria-hidden="true">·</span>
            <Link to="/digilocker" className="hover:text-slate-800">Integration Checklist</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
