import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('alex.vance@autocomm.io');
  const [password, setPassword] = useState('ClientAdmin@2026');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Authentication failed: Invalid username or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090e1a] text-slate-100 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="px-8 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-lg border border-teal-500/30">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold tracking-tight text-base">AutoComm</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-800 text-teal-400 rounded border border-slate-700">
                CORE OPS
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Communication Operations Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            SSO-Ready Session
          </div>
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            WhatsApp API & Voice Gateway Operational
          </div>
          <a href="#" className="text-slate-400 hover:text-white transition-colors">
            Help Center
          </a>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Information Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Enterprise Dual-Channel Orchestration
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Automated WhatsApp & AI Voice Calling at Scale
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
            AutoComm consolidates Meta Cloud WhatsApp broadcasting and low-latency voice agent automation.
            Manage customer directories, campaign lifecycles, real-time team inboxes, and autonomous AI dialogs from a unified operations console.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-lg pt-4">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400 font-medium">Compliance Standards</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">FIPS 140-2 • SOC2 Type II</div>
              <div className="text-[11px] text-teal-400 mt-0.5">TCPA & Meta HSM Compliant</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="text-xs text-slate-400 font-medium">Cluster Topology</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">Node-US-01 (v2.4.8-prod)</div>
              <div className="text-[11px] text-emerald-400 mt-0.5">99.98% Gateway Uptime</div>
            </div>
          </div>
        </div>

        {/* Right Sign-In Form */}
        <div className="lg:col-span-5">
          <div className="bg-[#101728] border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Sign In to AutoComm</h2>
              <p className="text-xs text-slate-400 mt-1">Enter your corporate credentials to access the console</p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Username or Corporate Email <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-teal-400 font-medium">Single Sign-On enabled</span>
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.vance@autocomm.io"
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <a href="#" className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs text-slate-400">Remember this device for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to AutoComm</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-3">
          <span>Protected by AutoComm Zero-Trust Security.</span>
          <span className="hidden md:inline">•</span>
          <span className="text-slate-400">Hardware key 2FA supported</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">System Status</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Need Help?</a>
        </div>
      </footer>
    </div>
  );
};
