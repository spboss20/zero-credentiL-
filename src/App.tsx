import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { HolderWallet } from './pages/HolderWallet.tsx';
import { IssuerPortal } from './pages/IssuerPortal.tsx';
import { VerifierPortal } from './pages/VerifierPortal.tsx';
import { IssuerDirectory } from './pages/IssuerDirectory.tsx';
import { DeveloperPortal } from './pages/DeveloperPortal.tsx';
import { DigiLockerPage } from './pages/DigiLockerPage.tsx';
import { DocsPage } from './pages/DocsPage.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/wallet" element={<HolderWallet />} />
              <Route path="/issuer" element={<IssuerPortal />} />
              <Route path="/verifier" element={<VerifierPortal />} />
              <Route path="/directory" element={<IssuerDirectory />} />
              <Route path="/developer" element={<DeveloperPortal />} />
              <Route path="/digilocker" element={<DigiLockerPage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
