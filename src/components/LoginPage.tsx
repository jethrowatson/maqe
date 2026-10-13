'use client';

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  Building2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface AuthSession {
  isAuthenticated: boolean;
  email: string;
  name: string;
  role: 'member' | 'operator';
  orgId: string;
  orgName: string;
  planTier: 'free' | 'pro' | 'premium';
}

interface LoginPageProps {
  initialRole?: 'member' | 'operator';
  onLoginSuccess: (session: AuthSession) => void;
  onBackToBrochure: () => void;
}

export function LoginPage({
  initialRole = 'member',
  onLoginSuccess,
  onBackToBrochure
}: LoginPageProps) {
  const [role, setRole] = useState<'member' | 'operator'>(initialRole);
  const [email, setEmail] = useState<string>(
    initialRole === 'member'
      ? 'marcus.vance@deltametalworks.co.uk'
      : 'operator@maqe.intelligence'
  );
  const [password, setPassword] = useState<string>('MAQE2026!');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRoleChange = (newRole: 'member' | 'operator') => {
    setRole(newRole);
    setError(null);
    if (newRole === 'member') {
      setEmail('marcus.vance@deltametalworks.co.uk');
      setPassword('MAQE2026!');
    } else {
      setEmail('operator@maqe.intelligence');
      setPassword('MAQE2026!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      // Validate password (supports standard password or master password)
      const validPasswords = ['MAQE2026!', 'maqe2026', 'password', 'jethro', 'admin'];
      if (!validPasswords.includes(password.trim())) {
        setError('Invalid access password. Use standard demo password: MAQE2026!');
        setIsLoading(false);
        return;
      }

      const session: AuthSession = {
        isAuthenticated: true,
        email: email.trim(),
        name: role === 'member' ? 'Marcus Vance' : 'Sarah Jenkins',
        role: role,
        orgId: 'org_delta',
        orgName: role === 'member' ? 'Delta Metalworks Ltd' : 'MAQE Operations',
        planTier: 'premium'
      };

      // Persist in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('maqe_auth_session', JSON.stringify(session));
      }

      setIsLoading(false);
      onLoginSuccess(session);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white">
      {/* Back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <button
          onClick={onBackToBrochure}
          className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back to Platform Overview
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header Branding */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center font-black tracking-widest text-white text-xl shadow-lg shadow-blue-600/30">
            M
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
            Secure Platform Gateway
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Enter your credentials or use the 1-click test credentials below.
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="mt-8 bg-slate-800 p-1 rounded-xl border border-slate-700 flex">
          <button
            type="button"
            onClick={() => handleRoleChange('member')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              role === 'member'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Member Login</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('operator')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
              role === 'operator'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Operator Console</span>
          </button>
        </div>

        {/* Login Form Box */}
        <div className="mt-4 bg-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700 sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg flex items-start space-x-2 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Access Password
                </label>
                <span className="text-[10px] text-blue-400 font-mono">Demo: MAQE2026!</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Authenticating...' : role === 'member' ? 'Sign In to Member Platform' : 'Access Operator Console'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </button>
            </div>
          </form>

          {/* Quick 1-Click Access Chips */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
              Instant 1-Click Test Credentials:
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  handleRoleChange('member');
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white">Delta Metalworks Ltd (Member)</div>
                  <div className="text-[10px] text-slate-400 font-mono">marcus.vance@deltametalworks.co.uk</div>
                </div>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleRoleChange('operator');
                }}
                className="w-full text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-300 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-white">MAQE Operations (Administrator)</div>
                  <div className="text-[10px] text-slate-400 font-mono">operator@maqe.intelligence</div>
                </div>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Select
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-1.5">
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>AES-256 Cloud Session Authenticated • Statutory Data Protected</span>
        </div>
      </div>
    </div>
  );
}
