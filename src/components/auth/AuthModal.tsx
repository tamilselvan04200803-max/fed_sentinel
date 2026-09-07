import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { UserRole } from '../../types';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    signIn,
    signUp,
    currentUser,
    signOut,
  } = useFedSentinel();

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('sarah.chen@fedsentinel.io');
  const [signInPassword, setSignInPassword] = useState('SecOps_ZeroTrust_2026!');
  const [signInRole, setSignInRole] = useState<UserRole>('SECOPS_ADMIN');

  // Sign Up State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpHospital, setSignUpHospital] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('SECOPS_ADMIN');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(signInEmail.trim(), signInPassword, signInRole);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setErrorMsg('All fields marked * are required to create a SecOps account.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(
        signUpName.trim(),
        signUpEmail.trim(),
        signUpPassword,
        signUpRole,
        signUpHospital.trim() || 'Federated Clinical Network'
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = (email: string, name: string, role: UserRole, affiliation: string) => {
    setSignInEmail(email);
    setSignInRole(role);
    signIn(email, 'SecOps_Pass_2026!', role, name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 tracking-tight">FedSentinel</span>
                <span className="text-[10px] font-mono-code uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  SecOps Access
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono-code">
                Zero-Trust Identity &amp; Enclave Gatekeeper
              </p>
            </div>
          </div>
          <button
            onClick={() => setAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200">
          <button
            onClick={() => {
              setAuthModalTab('signin');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-md transition-all ${
              authModalTab === 'signin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthModalTab('signup');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-bold rounded-md transition-all ${
              authModalTab === 'signup'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            type="button"
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authModalTab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="analyst@hospital-consortium.org"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Passcode / Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono-code"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clearance Level / Role *
                </label>
                <select
                  value={signInRole}
                  onChange={(e) => setSignInRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                >
                  <option value="SECOPS_ADMIN">SecOps Administrator (Full Authority)</option>
                  <option value="FORENSIC_ANALYST">Forensic Analyst (Audit &amp; Quarantine)</option>
                  <option value="CLINICAL_AUDITOR">Clinical Enclave Auditor (Read-Only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full py-2.5 px-4 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to SecOps Console'}</span>
              </button>

              {/* Quick Preset Demo Logins */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  One-Click Demo Profiles:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoLogin(
                        'sarah.chen@fedsentinel.io',
                        'Dr. Sarah Chen',
                        'SECOPS_ADMIN',
                        'National Clinical AI Consortium'
                      )
                    }
                    className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">Dr. Sarah Chen</span>
                      <span className="text-[10px] text-slate-500 font-mono-code">SecOps Lead &bull; Admin Clearance</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Lead
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoLogin(
                        'marcus.brody@fedsentinel.io',
                        'Marcus Brody',
                        'FORENSIC_ANALYST',
                        'Hospital Threat Intel Unit'
                      )
                    }
                    className="p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">Marcus Brody</span>
                      <span className="text-[10px] text-slate-500 font-mono-code">Forensic Gradient Investigator</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Forensics
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Dr. Jordan Hayes"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital / Clinical Network *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signUpHospital}
                    onChange={(e) => setSignUpHospital(e.target.value)}
                    placeholder="Mount Sinai Health System"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Institutional Work Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="jordan.hayes@mountsinai.org"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-10 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono-code"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Security Clearance *
                </label>
                <select
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                >
                  <option value="SECOPS_ADMIN">SecOps Administrator (Level 4)</option>
                  <option value="FORENSIC_ANALYST">Forensic Investigator (Level 3)</option>
                  <option value="CLINICAL_AUDITOR">Clinical Enclave Auditor (Level 2)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full py-2.5 px-4 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isSubmitting ? 'Creating Account...' : 'Register SecOps Credentials'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
