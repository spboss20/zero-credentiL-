import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ChevronDown, Check, UserCircle, LogOut, Terminal, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { UserRole } from '../types/index.ts';

export const Navbar: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Wallet', path: '/wallet' },
    { label: 'Issuer Desk', path: '/issuer' },
    { label: 'Verifier Portal', path: '/verifier' },
    { label: 'Trust Registry', path: '/directory' },
  ];

  const roleOptions: { role: UserRole; title: string; subtitle: string }[] = [
    { role: 'holder', title: 'Holder Wallet', subtitle: 'View & present credentials' },
    { role: 'issuer', title: 'Accredited Issuer', subtitle: 'Issue & revoke W3C credentials' },
    { role: 'verifier', title: 'Verifier Service', subtitle: 'Verify proofs & evaluate policies' },
    { role: 'admin', title: 'Platform Admin', subtitle: 'Registry & developer governance' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Single text element wordmark */}
        <Link to="/" className="flex items-center gap-2.5 text-slate-900 group whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            ZeroPass
          </span>
        </Link>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-indigo-600 font-semibold'
                    : 'hover:text-slate-900 text-slate-600'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/developer"
            className={`transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/developer'
                ? 'text-indigo-600 font-semibold'
                : 'hover:text-slate-900 text-slate-600'
            }`}
          >
            API & SDK
          </Link>
          <Link
            to="/digilocker"
            className={`transition-colors whitespace-nowrap shrink-0 text-slate-500 hover:text-slate-800 ${
              location.pathname === '/digilocker' ? 'text-indigo-600 font-semibold' : ''
            }`}
          >
            DigiLocker Spec
          </Link>
        </nav>

        {/* Zone 3: 1 primary action / Role context switch */}
        <div className="flex items-center gap-3 shrink-0 relative">
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200/80 whitespace-nowrap shrink-0"
              title="Switch testing role"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
              <span className="capitalize font-semibold text-slate-900">{role}</span>
              <span className="text-slate-400 hidden sm:inline">Role</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-left"
                onMouseLeave={() => setRoleMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {user?.name || 'Active Account'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {user?.did || 'Loading identity...'}
                  </div>
                </div>

                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona
                </div>

                {roleOptions.map((opt) => (
                  <button
                    key={opt.role}
                    onClick={() => {
                      switchRole(opt.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-start gap-2.5 rounded-lg text-xs transition-colors ${
                      role === opt.role
                        ? 'bg-indigo-50/80 text-indigo-900 font-medium'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5">
                      {role === opt.role ? (
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{opt.title}</div>
                      <div className="text-[11px] text-slate-500">{opt.subtitle}</div>
                    </div>
                  </button>
                ))}

                <div className="mt-1 pt-1 border-t border-slate-100 px-2">
                  <Link
                    to="/docs"
                    onClick={() => setRoleMenuOpen(false)}
                    className="w-full px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-2 rounded-lg hover:bg-slate-50"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Technical Docs & Specs
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            to={role === 'issuer' ? '/issuer' : role === 'verifier' ? '/verifier' : '/wallet'}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            Launch Console
          </Link>
        </div>

      </div>

      {/* Mobile navigation row */}
      <div className="lg:hidden border-t border-slate-100 bg-slate-50/60 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium text-slate-600">
        <Link to="/" className="whitespace-nowrap hover:text-indigo-600">Overview</Link>
        <Link to="/wallet" className="whitespace-nowrap hover:text-indigo-600">Wallet</Link>
        <Link to="/issuer" className="whitespace-nowrap hover:text-indigo-600">Issuer</Link>
        <Link to="/verifier" className="whitespace-nowrap hover:text-indigo-600">Verifier</Link>
        <Link to="/directory" className="whitespace-nowrap hover:text-indigo-600">Registry</Link>
        <Link to="/developer" className="whitespace-nowrap hover:text-indigo-600">API</Link>
        <Link to="/digilocker" className="whitespace-nowrap hover:text-indigo-600">DigiLocker</Link>
      </div>
    </header>
  );
};
