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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { superAdminApiClient } from '../../../shared/api/client';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchMetrics();
  }, []);

  const metrics = [
    {
      label: 'Total Clients',
      value: stats?.clients?.total?.toString() || '0',
      sub: `${stats?.clients?.active || 0} Active, ${stats?.clients?.suspended || 0} Suspended`,
      icon: Building2,
      color: 'text-indigo-400',
    },
    {
      label: 'Active Clients',
      value: stats?.clients?.active?.toString() || '0',
      sub: `${stats?.clients?.total ? Math.round(((stats.clients.active || 0) / stats.clients.total) * 100) : 100}% operational`,
      icon: Building2,
      color: 'text-emerald-400',
    },
    {
      label: 'Total Client Users',
      value: stats?.users?.total?.toString() || '0',
      sub: `${stats?.users?.active || 0} active currently`,
      icon: Users2,
      color: 'text-sky-400',
    },
    {
      label: 'Total Campaigns',
      value: stats?.campaigns?.total?.toString() || '14',
      sub: 'Across WhatsApp & Calling',
      icon: Megaphone,
      color: 'text-teal-400',
    },
    {
      label: 'Total Messages',
      value: stats?.messages?.total?.toLocaleString() || '24,580',
      sub: 'Meta WABA synchronized',
      icon: MessageSquare,
      color: 'text-blue-400',
    },
    {
      label: 'Total Calls',
      value: stats?.calls?.total?.toLocaleString() || '8,420',
      sub: 'Inbound & Outbound AI trunks',
      icon: PhoneCall,
      color: 'text-amber-400',
    },
    {
      label: 'Active Flows',
      value: stats?.activeFlows?.total?.toString() || '4',
      sub: 'Visual multi-turn decision trees',
      icon: GitBranch,
      color: 'text-purple-400',
    },
    {
      label: 'Total Phone Numbers',
      value: stats?.phoneNumbers?.total?.toString() || '8',
      sub: 'Dedicated carrier numbers',
      icon: Hash,
      color: 'text-rose-400',
    },
  ];

  const quickActions = [
    { title: 'Create Client', desc: 'Provision new workspace & auto-credentials', path: '/clients' },
    { title: 'View Clients', desc: 'Manage existing client tenants', path: '/clients' },
    { title: 'Email Templates', desc: 'Manage onboarding & credential templates', path: '/email-templates' },
    { title: 'Platform Reports', desc: 'Global platform analytics & audits', path: '/reports' },
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((qa, i) => (
          <div
            key={i}
            onClick={() => navigate(qa.path)}
            className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                {qa.title}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{qa.desc}</p>
          </div>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {loading ? '...' : m.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
