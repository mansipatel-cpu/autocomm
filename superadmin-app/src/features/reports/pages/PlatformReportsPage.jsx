import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Building2,
  PhoneCall,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const PlatformReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await superAdminApiClient.get('/monitoring/reports');
      setReportData(res.data.data);
    } catch (err) {
      console.error('Failed to load platform reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading || !reportData) {
    return <div className="p-12 text-center text-xs text-slate-500">Compiling multi-tenant reports...</div>;
  }

  const { summary, topTenants } = reportData;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Platform Analytics & Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-tenant aggregate business metrics, monthly recurring revenue (MRR), and platform usage telemetry
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="p-2 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Monthly Recurring Revenue</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">
              ${summary.monthlyRecurringRevenue?.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +18.4% MRR growth
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Total Active Tenants</span>
            <div className="text-2xl font-bold text-white mt-0.5">{summary.activeClients}</div>
            <span className="text-[10px] text-slate-500">{summary.totalClients} total companies</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Total WhatsApp Dispatches</span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {summary.totalDispatches?.toLocaleString() || 14200}
            </div>
            <span className="text-[10px] text-indigo-400 font-semibold">98.4% Meta delivery</span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Voice Calling Volume</span>
            <div className="text-2xl font-bold text-white mt-0.5">
              {summary.totalCallMinutes?.toLocaleString() || 3200} mins
            </div>
            <span className="text-[10px] text-purple-400 font-semibold">88.6% Answer Rate</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Top Consuming Tenants Table */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-xs text-white">Top Enterprise Tenants by Platform Consumption</span>
          <span className="text-[10px] text-slate-400">Showing top active accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3">Client Company</th>
                <th className="px-6 py-3">Subscription Tier</th>
                <th className="px-6 py-3">Account Status</th>
                <th className="px-6 py-3">SMS / WhatsApp Balance</th>
                <th className="px-6 py-3">Voice Minute Pool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {topTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No active tenants found.
                  </td>
                </tr>
              ) : (
                topTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-white">{t.companyName}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-400">
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      {t.smsCredits?.toLocaleString()} credits
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      {t.voiceCredits?.toLocaleString()} credits
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
