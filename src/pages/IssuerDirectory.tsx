import React, { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  ShieldCheck,
  ExternalLink,
  Key,
  CheckCircle2,
  FileCode,
  Filter,
} from 'lucide-react';
import { api } from '../services/api.ts';
import type { TrustedIssuer } from '../types/index.ts';

export const IssuerDirectory: React.FC = () => {
  const [issuers, setIssuers] = useState<TrustedIssuer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedJwk, setSelectedJwk] = useState<{ issuer: TrustedIssuer } | null>(null);

  useEffect(() => {
    api.getIssuers().then((res) => setIssuers(res.issuers)).catch(console.error);
  }, []);

  const filtered = issuers.filter((iss) => {
    const matchesSearch =
      iss.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iss.did.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || iss.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'Higher Education', 'Government & Civil', 'Financial & Tax', 'Professional Licensing'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Trust Framework & Root Anchors</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Trusted Issuer Registry
        </h1>
        <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
          The ZeroPass Trust Registry maintains authenticated decentralized identifiers (DIDs) and cryptographic public keys of accredited issuing bodies. Verifiers validate issuer authenticity against this registry.
        </p>

        {/* Development Seed Disclosure */}
        <div className="p-3.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600">
          <strong>Transparency Notice:</strong> All issuers shown below are designated development seed authorities with generated cryptographic keypairs for testing W3C Verifiable Credentials and zero-knowledge predicates. None are labeled as real government bodies.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by institution name or DID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Issuers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((issuer) => (
          <div
            key={issuer.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-sm text-slate-900">{issuer.name}</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{issuer.category}</span>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ✓ Verified Authority
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {issuer.description}
              </p>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1 font-mono">
                <div className="text-[11px] text-slate-400">ISSUER DID:</div>
                <div className="text-slate-800 break-all select-all">{issuer.did}</div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Supported Credential Schemas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {issuer.supportedSchemas.map((schema) => (
                    <span key={schema} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-mono">
                      {schema}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setSelectedJwk({ issuer })}
                className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
              >
                <Key className="w-3.5 h-3.5" />
                Inspect Public Key (JWK)
              </button>

              <a
                href={`/api/issuers/${encodeURIComponent(issuer.did)}/did.json`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
              >
                W3C DID Document <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* JWK Modal */}
      {selectedJwk && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Public Cryptographic Key (JWK / ES256)
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedJwk.issuer.did}
                </p>
              </div>
              <button
                onClick={() => setSelectedJwk(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Verifiers use this public key to verify that credentials were authenticated by <strong>{selectedJwk.issuer.name}</strong> without consulting any centralized server.
            </p>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              {JSON.stringify(selectedJwk.issuer.publicKeyJwk, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJwk(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close Key Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
