import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Layers,
  Radio,
  RefreshCw,
  Server,
  Zap,
  PhoneCall,
  MessageSquare,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const MonitoringPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('system'); // 'system', 'campaigns', 'channels', 'calls'

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [metricsRes, clientsRes] = await Promise.all([
        superAdminApiClient.get('/monitoring/metrics'),
        superAdminApiClient.get('/clients'),
      ]);
      setMetrics(metricsRes.data.data);
      setClients(clientsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load system metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return <div className="p-12 text-center text-xs text-slate-500">Connecting to platform telemetry...</div>;
  }

  const { server, databases, queues } = metrics || {};

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cross-Tenant Platform Monitoring</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live telemetry, BullMQ async queues, memory buffers, Redis cluster state, and multi-tenant resource consumption
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Telemetry Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Node.js Process RSS</span>
            <div className="text-xl font-bold text-white mt-0.5">{server?.memoryRssMb} MB</div>
            <span className="text-[10px] text-slate-500">Heap Used: {server?.heapUsedMb} MB</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">MongoDB Replica / Cluster</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              {databases?.mongodb}
            </div>
            <span className="text-[10px] text-slate-500">Mongoose ORM Connected</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">BullMQ Queue Engine</span>
            <div className="text-xl font-bold text-white mt-0.5">{queues?.activeDispatchRuns} Active Runs</div>
            <span className="text-[10px] text-indigo-400 font-semibold">{queues?.campaignQueue}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Concurrent Calls (Live)</span>
            <div className="text-xl font-bold text-white mt-0.5">{queues?.concurrentVoiceCalls} Calls</div>
            <span className="text-[10px] text-slate-500">24h Total: {queues?.callsInLast24h} calls</span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
        {[
          { id: 'system', label: 'System & Worker Queues' },
          { id: 'tenants', label: 'Tenant Infrastructure Health' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-2 font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'system' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" /> Process Environment & Host
            </h3>
            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Node.js Engine</span>
                <span className="font-mono text-white">{server?.nodeVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Process Uptime</span>
                <span className="font-mono text-white">{Math.floor((server?.uptimeSeconds || 0) / 60)} minutes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Host CPU Cores</span>
                <span className="font-mono text-white">{server?.cpuCores} Cores Allocated</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>System Memory Total</span>
                <span className="font-mono text-white">{server?.systemTotalMemMb} MB</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-2xl space-y-3 text-xs">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Queue & Webhook Dispatch Status
            </h3>
            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Redis Persistence</span>
                <span className="font-mono text-emerald-400">{databases?.redis}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Meta WhatsApp Webhook Health</span>
                <span className="font-mono text-emerald-400">{queues?.webhookHealth}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Active Campaign Dispatch Runs</span>
                <span className="font-mono text-white">{queues?.activeDispatchRuns}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span>Realtime WebSocket Concurrency</span>
                <span className="font-mono text-white">Socket.IO Tenant Rooms Active</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0f1d] border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 font-bold text-xs text-white">
            Active Tenant Provisioning & Resources
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b14] border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-6 py-3">Tenant Company</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">SMS Pool Credits</th>
                  <th className="px-6 py-3">Voice Pool Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-bold text-white">{c.companyName}</td>
                    <td className="px-6 py-4 font-semibold text-indigo-400">{c.plan}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono">{c.credits?.sms?.toLocaleString() || 1000}</td>
                    <td className="px-6 py-4 font-mono">{c.credits?.voice?.toLocaleString() || 500}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
