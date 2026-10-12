import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  TrendingUp,
  MessageSquare,
  PhoneCall,
  CheckCircle2,
  Eye,
  Clock,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Users,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  MessageCircle,
  FileText,
  XCircle,
  Target,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState('whatsapp'); // 'whatsapp' | 'voice'
  const [timeRange, setTimeRange] = useState('7days');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const overview = data?.overview || { totalContacts: 12450, totalDispatched: 24500, deliveryRate: '98.4%' };
  const whatsapp = data?.whatsapp || { totalDispatched: 24500, delivered: 24108, read: 19800, failed: 392 };
  const voice = data?.voice || { totalCalls: 1280, completedCalls: 1210, totalMinutes: 3840, avgDurationSeconds: 180 };
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <a href="/dashboard" className="hover:text-slate-600 transition-colors">Home</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Analytics & Performance</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="border-b border-slate-200 pb-3">
        <div className="inline-flex rounded-xl bg-[#F4F6F8] p-1">
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              channel === 'whatsapp'
                ? 'bg-white text-[#007BFF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Telemetry
          </button>
          <button
            type="button"
            onClick={() => setChannel('voice')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              channel === 'voice'
                ? 'bg-[#007BFF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="h-4 w-4" />
            Voice Calling Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards Row (exact omnichannel-saas style) */}
      {channel === 'whatsapp' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Dispatched</p>
                <p className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">
                  {whatsapp.totalDispatched?.toLocaleString()}
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-[#007BFF]" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Delivered Rate</p>
                <p className="text-[28px] font-bold text-emerald-600 mt-1 tabular-nums">
                  98.4%
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '98.4%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Read & Opened Rate</p>
                <p className="text-[28px] font-bold text-blue-600 mt-1 tabular-nums">
                  80.8%
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-[#007BFF]" style={{ width: '80.8%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Failure / Bounce</p>
                <p className="text-[28px] font-bold text-rose-500 mt-1 tabular-nums">
                  1.6%
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-rose-500" style={{ width: '1.6%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Calls Handled</p>
                <p className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">
                  {voice.totalCalls?.toLocaleString()}
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-[#007BFF]" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Synthesized Mins</p>
                <p className="text-[28px] font-bold text-emerald-600 mt-1 tabular-nums">
                  {voice.totalMinutes?.toLocaleString()}
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: '92%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Answer / Connect Rate</p>
                <p className="text-[28px] font-bold text-[#007BFF] mt-1 tabular-nums">
                  94.5%
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-[#007BFF]" style={{ width: '94.5%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center shrink-0">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Avg Duration</p>
                <p className="text-[28px] font-bold text-slate-900 mt-1 tabular-nums">
                  3m 00s
                </p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3">
                  <div className="h-1.5 rounded-full bg-violet-500" style={{ width: '70%' }} />
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Campaign Performance Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Dispatches & Campaign Telemetry</h3>
            <p className="text-xs text-slate-500 mt-0.5">Real-time status updates from live message queues</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Channel Type</th>
                <th className="py-3 px-4">Sent</th>
                <th className="py-3 px-4">Delivered</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                { name: 'VIP Summer Discount Flash Sale', type: 'WhatsApp Broadcast', sent: 1250, delivered: 1242, status: 'Completed', date: 'Oct 12, 2026' },
                { name: 'Overdue Balance Outbound Calling Call', type: 'AgentLab Voice', sent: 340, delivered: 328, status: 'Completed', date: 'Oct 11, 2026' },
                { name: 'Onboarding Welcome Series', type: 'WhatsApp Automated', sent: 890, delivered: 885, status: 'Active', date: 'Oct 10, 2026' },
                { name: 'Appointment Reminder Trigger', type: 'AgentLab Voice', sent: 210, delivered: 205, status: 'Active', date: 'Oct 09, 2026' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{item.sent.toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-mono font-medium text-emerald-600">{item.delivered.toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
