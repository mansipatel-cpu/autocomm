import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users2,
  Megaphone,
  MessageSquare,
  PhoneCall,
  GitBranch,
  Hash,
  Bot,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  FileCode,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { superAdminApiClient } from '../../../shared/api/client';
import { ManageCreditsModal } from '../components/ManageCreditsModal';
import { AuditLogsModal } from '../components/AuditLogsModal';
import { CreateClientModal } from '../../clients/components/CreateClientModal';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);

  const fetchMetrics = async () => {
    try {
      const res = await superAdminApiClient.get('/dashboard/metrics');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const metrics = [
    {
      label: 'Total Clients',
      value: stats?.clients?.total?.toString() || '0',
      sub: 'All provisioned tenant workspaces',
      icon: Building2,
      color: 'text-indigo-400',
    },
    {
      label: 'Active Clients',
      value: stats?.clients?.active?.toString() || '0',
      sub: `${stats?.clients?.total ? Math.round(((stats.clients.active || 0) / stats.clients.total) * 100) : 100}% operational`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
    },
    {
      label: 'Inactive Clients',
      value: stats?.clients?.inactive?.toString() || '0',
      sub: 'Dormant or unverified accounts',
      icon: XCircle,
      color: 'text-slate-400',
    },
    {
      label: 'Suspended Clients',
      value: stats?.clients?.suspended?.toString() || '0',
      sub: 'Access restricted accounts',
      icon: AlertTriangle,
      color: 'text-rose-400',
    },
    {
      label: 'Total Client Users',
      value: stats?.users?.total?.toString() || '0',
      sub: 'Across all client tenants',
      icon: Users2,
      color: 'text-sky-400',
    },
    {
      label: 'Active Users',
      value: stats?.users?.active?.toString() || '0',
      sub: 'Active client team operators',
      icon: UserCheck,
      color: 'text-teal-400',
    },
    {
      label: 'Total Campaigns',
      value: stats?.campaigns?.total?.toString() || '0',
      sub: 'WhatsApp & voice broadcast runs',
      icon: Megaphone,
      color: 'text-amber-400',
    },
    {
      label: 'Active Campaigns',
      value: stats?.campaigns?.active?.toString() || '0',
      sub: 'Currently running delivery queues',
      icon: Radio,
      color: 'text-emerald-400',
    },
    {
      label: 'Total Messages',
      value: stats?.messages?.total?.toLocaleString() || '0',
      sub: 'Meta WABA synchronized',
      icon: MessageSquare,
      color: 'text-blue-400',
    },
    {
      label: 'Total Calls',
      value: stats?.calls?.total?.toLocaleString() || '0',
      sub: 'Inbound & outbound AI trunks',
      icon: PhoneCall,
      color: 'text-cyan-400',
    },
    {
      label: 'Total Contacts',
      value: stats?.contacts?.total?.toLocaleString() || '0',
      sub: 'Aggregated client address books',
      icon: Users2,
      color: 'text-fuchsia-400',
    },
    {
      label: 'Total Templates',
      value: stats?.templates?.total?.toString() || '0',
      sub: 'Approved WhatsApp message templates',
      icon: FileCode,
      color: 'text-violet-400',
    },
    {
      label: 'Total AI Agents',
      value: stats?.aiAgents?.total?.toString() || '0',
      sub: 'Voice & text conversational bots',
      icon: Bot,
      color: 'text-pink-400',
    },
    {
      label: 'Total Active Flows',
      value: stats?.activeFlows?.total?.toString() || '0',
      sub: 'Visual multi-turn decision trees',
      icon: GitBranch,
      color: 'text-purple-400',
    },
    {
      label: 'Total Phone Numbers',
      value: stats?.phoneNumbers?.total?.toString() || '0',
      sub: 'Dedicated carrier numbers',
      icon: Hash,
      color: 'text-orange-400',
    },
  ];

  const quickActions = [
    {
      title: 'Create Client',
      desc: 'Provision new workspace & auto-credentials',
      action: () => setIsCreateClientOpen(true),
      icon: Building2,
    },
    {
      title: 'View Clients',
      desc: 'Manage existing client tenants',
      action: () => navigate('/clients'),
      icon: ArrowUpRight,
    },
    {
      title: 'Manage Credits',
      desc: 'Recharge or adjust tenant balances',
      action: () => setIsCreditsModalOpen(true),
      icon: Coins,
    },
    {
      title: 'Email Templates',
      desc: 'Manage onboarding & credential templates',
      action: () => navigate('/email-templates'),
      icon: FileText,
    },
    {
      title: 'Audit Logs',
      desc: 'Platform-wide security trail',
      action: () => setIsAuditModalOpen(true),
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Platform telemetry across all tenant workspaces</p>
        </div>
      </div>

      {/* 5 Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <div
                key={i}
                onClick={qa.action}
                className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                    {qa.title}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{qa.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 15 Metric Cards */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Platform Metrics (15 Core KPIs)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{m.label}</span>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div className="text-2xl font-bold text-white mt-2">
                  {loading ? '...' : m.value}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{m.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <CreateClientModal
        isOpen={isCreateClientOpen}
        onClose={() => setIsCreateClientOpen(false)}
        onClientCreated={() => {
          setIsCreateClientOpen(false);
          fetchMetrics();
        }}
      />

      <ManageCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        onUpdated={fetchMetrics}
      />

      <AuditLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />
    </div>
  );
};
