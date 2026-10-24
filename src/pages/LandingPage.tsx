import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Key,
  Lock,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Building2,
  FileCheck2,
  Fingerprint,
  Layers,
  ChevronRight,
  Database,
  Cpu,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [demoRevealed, setDemoRevealed] = useState(false);

  return (
    <div className="space-y-24 py-12">
      
      {/* 1. Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>Decentralized Identity Infrastructure</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] max-w-2xl">
              Your credentials. <br />
              <span className="text-indigo-600">Your privacy.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              ZeroPass enables organizations to issue tamper-evident credentials, lets users hold cryptographic proof in their personal wallet, and allows verifiers to validate eligibility predicates without ever touching private personal data.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/wallet"
                className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                Explore the platform
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                How it works
              </a>
            </div>

            <div className="pt-6 border-t border-slate-200/80 flex items-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>W3C VC 2.0 Standard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>ECDSA ES256 Signatures</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero-Knowledge Predicates</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Visual Anchor */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white border border-slate-200 shadow-xl p-6 overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-50/70 blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-900">Selective Disclosure Interactive Proof</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ES256 Verified
                </span>
              </div>

              {/* Credential Attributes with Toggle */}
              <div className="mt-4 space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Holder DID:</span>
                    <span className="font-mono text-[11px] text-slate-800">did:zeropass:holder-sp-8842</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Issuing Body:</span>
                    <span className="font-medium text-slate-800">Aethelgard Polytechnic University</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Full Legal Name</span>
                    <span className="font-medium text-slate-900 font-mono">Saksham Patwa</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">National ID Number</span>
                    <span className="font-mono text-xs text-slate-800">
                      {demoRevealed ? '9984-XXXX-XXXX' : '•••••••••••• (Withheld)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Exact Date of Birth</span>
                    <span className="font-mono text-xs text-slate-800">
                      {demoRevealed ? '2002-05-18' : '••••-••-•• (Withheld)'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-emerald-700 font-medium">
                    <span>Proven Predicate: Age ≥ 18</span>
                    <span className="font-mono text-xs">✓ Cryptographically Valid</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setDemoRevealed(!demoRevealed)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {demoRevealed ? 'Apply Zero-Knowledge Shield' : 'Toggle Raw Data Reveal'}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {demoRevealed ? 'Reveals raw identity attributes' : 'Discloses zero raw PII to verifier'}
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. Architecture Section (Issuer, Holder Wallet, Verifier) */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Architecture
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            The Three Pillars of Verifiable Identity
          </h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Inspired by the W3C Verifiable Credentials Data Model and the Privado ID triangle, ZeroPass establishes cryptographic trust between independent participants without central data aggregation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 01. Issuer */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                1. The Issuer
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorized organizations (universities, civil registries, licensing boards) assert facts about an identity. The issuer defines a typed schema, validates holder eligibility, and cryptographically signs a W3C Verifiable Credential using their ECDSA ES256 private key.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <Link
                to="/issuer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Explore Issuer Portal <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 02. Holder Wallet */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                2. The Holder Wallet
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Users hold and maintain custody of their credentials in a self-sovereign wallet. When a verifier requests proof, the holder inspects the verification policy, grants explicit consent, and selectively discloses only the required attributes or predicate proofs.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <Link
                to="/wallet"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Open Holder Wallet <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 03. Verifier */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                3. The Verifier
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Organizations establish verification policies (e.g. "age ≥ 18", "income &lt; $300k", or "active student"). Verifiers audit the proof presentation cryptographically against issuer public keys, revocation registries, and predicate bounds.
              </p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <Link
                to="/verifier"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                Configure Verifier Policy <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Core Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-3xl text-white p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl mb-12 space-y-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Privacy Guarantees
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Cryptographic Trust Without Data Surveillance
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Traditional authentication requires sending copies of government IDs and documents to third-party databases, creating honeypots for identity theft. ZeroPass flips the security model.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400 mb-3">
                <EyeOff className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white">Selective Disclosure</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Disclose only your name and enrollment status while cryptographically withholding your address, birth date, and national identifier.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 mb-3">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white">Zero-Knowledge Predicates</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prove numerical inequalities (age ≥ 21, income &lt; threshold, GPA ≥ 3.5) without disclosing your exact birthdate or financial statements.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 mb-3">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white">Revocation Registry</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time cryptographic revocation lists ensure invalidated credentials cannot be reused, with zero holder tracking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-purple-400 mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white">Standard JWS & JWK</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built on open RFC 7515/7519 standards and W3C VC 2.0 specifications with ECDSA P-256 for interoperability across wallets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Workflow Lifecycle Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            Verification Lifecycle
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            How a ZeroPass Presentation Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-indigo-600 block mb-2">STEP 01</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Request Creation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifier generates a policy containing approved issuer DIDs, required fields, and fresh random challenge nonces.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-indigo-600 block mb-2">STEP 02</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Wallet Pairing</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Holder scans a QR code or opens a deep link in their compliant wallet, establishing a peer-to-peer session.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-indigo-600 block mb-2">STEP 03</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Consent & Sign</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Holder selects which credential to present, reviews requested fields, and cryptographically signs the presentation token.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200">
            <span className="text-xs font-mono font-bold text-indigo-600 block mb-2">STEP 04</span>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Cryptographic Audit</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Server executes signature validation, issuer verification, revocation registry lookup, and predicate math.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Direct Launch Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-indigo-50/60 rounded-3xl p-10 border border-indigo-100 max-w-4xl mx-auto space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">
            Ready to test credential issuance and verification?
          </h3>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Switch between Holder, Issuer, and Verifier roles at any time using the active role selector in the navigation bar.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link
              to="/wallet"
              className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Open Holder Wallet
            </Link>
            <Link
              to="/issuer"
              className="px-6 py-2.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
            >
              Issue Credentials
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
