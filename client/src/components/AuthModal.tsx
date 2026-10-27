import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { X, Lock, Mail, User as UserIcon, Phone, Home, Sparkles, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab || 'login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regHostel, setRegHostel] = useState('UNIWORLD_1');
  const [regRoom, setRegRoom] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync tab with context if opened
  React.useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalTab);
      setError(null);
    }
  }, [isAuthModalOpen, authModalTab]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        displayName: regName,
        email: regEmail,
        password: regPassword,
        hostel: regHostel,
        roomNumber: regRoom,
        phoneNumber: regPhone,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (email: string, pass: string) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-sm text-slate-400 hover:text-blue-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-blue-50 to-white border-b border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-sm bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              CF
            </span>
            <span className="font-extrabold text-slate-900 text-lg">CampusFind</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {tab === 'login' ? 'Sign in to your account' : 'Join CampusFind'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tab === 'login'
              ? 'Enter your credentials to report, claim, and recover items.'
              : 'Create your student profile to post and manage campus listings.'}
          </p>

          {/* Tab selector */}
          <div className="flex bg-slate-100 rounded-sm p-1 mt-4 border border-slate-200">
            <button
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all ${
                tab === 'login'
                  ? 'bg-white text-blue-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-sm transition-all ${
                tab === 'register'
                  ? 'bg-white text-blue-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-sm bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* 1-Click Demo Accounts for Rapid Evaluation */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Demo 1-Click Accounts:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('student@campus.edu', 'Password123!')}
                    className="px-2 py-1.5 rounded-sm border border-blue-200 text-[11px] font-medium text-blue-900 bg-blue-50/50 hover:bg-blue-100/60 text-center"
                  >
                    Alex (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('finder@campus.edu', 'Password123!')}
                    className="px-2 py-1.5 rounded-sm border border-blue-200 text-[11px] font-medium text-blue-900 bg-blue-50/50 hover:bg-blue-100/60 text-center"
                  >
                    Priya (Finder)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('moderator@campus.edu', 'AdminSecret123!')}
                    className="px-2 py-1.5 rounded-sm border border-blue-300 bg-blue-100/80 text-[11px] font-bold text-blue-950 hover:bg-blue-200/80 text-center"
                  >
                    Moderator
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com or any email"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password * (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hostel (Optional)
                  </label>
                  <select
                    value={regHostel}
                    onChange={(e) => setRegHostel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  >
                    <option value="UNIWORLD_1">Uniworld 1</option>
                    <option value="UNIWORLD_2">Uniworld 2</option>
                    <option value="OTHER">Other / Day Scholar</option>
                    <option value="NONE">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Room No. (Optional)
                  </label>
                  <div className="relative">
                    <Home className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={regRoom}
                      onChange={(e) => setRegRoom(e.target.value)}
                      placeholder="e.g. 204"
                      className="w-full pl-8 pr-2 py-2 text-xs rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional - kept private by default)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-blue-600 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
