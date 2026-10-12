import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  UserPlus,
  FilePlus,
  PhoneCall,
  Users,
  UserRound,
  Megaphone,
  Activity,
  MessageSquare,
  CircleAlert,
  PhoneOff,
  Pencil,
  X,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [campaignChoiceOpen, setCampaignChoiceOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live state with realistic defaults
  const [stats, setStats] = useState({
    totalUsers: 1245,
    recentUsers: 12,
    totalCampaigns: 24,
    ongoingCampaigns: 5,
    completedMessages: 18450,
    failedMessages: 32,
    completedCalls: 4820,
    failedCalls: 86,
  });

  const [campaigns, setCampaigns] = useState([
    {
      id: 'c1',
      name: 'Black Friday VIP Flash Sale Broadcast',
      type: 'WhatsApp',
      status: 'Ongoing',
      audience: 2500,
      progress: 68,
      created: '2026-10-10',
      href: '/campaigns',
    },
    {
      id: 'c2',
      name: 'Enterprise Renewal AI Voice Follow-up',
      type: 'Auto Calling',
      status: 'Ongoing',
      audience: 450,
      progress: 82,
      created: '2026-10-09',
      href: '/campaigns',
    },
    {
      id: 'c3',
      name: 'Abandoned Cart WhatsApp Recovery Series',
      type: 'WhatsApp',
      status: 'Completed',
      audience: 1280,
      progress: 100,
      created: '2026-10-08',
      href: '/campaigns',
    },
    {
      id: 'c4',
      name: 'Q4 Customer Feedback Voice Survey',
      type: 'Auto Calling',
      status: 'Scheduled',
      audience: 890,
      progress: 0,
      created: '2026-10-07',
      href: '/campaigns',
    },
  ]);

  const [recentUsers, setRecentUsers] = useState([
    {
      id: 'u1',
      name: 'Michael Scott',
      phone: '+1 (555) 928-1029',
      campaign: 'Enterprise Renewal AI Voice Follow-up',
      activity: '3 calls',
      status: 'Active',
    },
    {
      id: 'u2',
      name: 'Pam Beesly',
      phone: '+1 (555) 482-1920',
      campaign: 'Black Friday VIP Flash Sale Broadcast',
      activity: '1 message',
      status: 'Active',
    },
    {
      id: 'u3',
      name: 'Jim Halpert',
      phone: '+1 (555) 301-4491',
      campaign: 'Abandoned Cart WhatsApp Recovery Series',
      activity: '2 messages',
      status: 'Pending',
    },
    {
      id: 'u4',
      name: 'Dwight Schrute',
      phone: '+1 (555) 819-2049',
      campaign: 'Enterprise Renewal AI Voice Follow-up',
      activity: '5 calls',
      status: 'Active',
    },
  ]);

  const [templates, setTemplates] = useState([
    {
      id: 't1',
      name: 'order_status_update',
      channel: 'WhatsApp',
      preview: 'Hello {{1}}, your AutoComm order #{{2}} is now confirmed and in transit!',
      status: 'Active',
      href: '/templates',
    },
    {
      id: 't2',
      name: 'demo_scheduled_call',
      channel: 'Calling',
      preview: 'Hello, this is AutoComm confirming your personalized demo tomorrow at 2 PM.',
      status: 'Active',
      href: '/templates',
    },
    {
      id: 't3',
      name: 'account_security_alert',
      channel: 'WhatsApp',
      preview: 'Security Alert: A new login was detected on your account from {{1}}.',
      status: 'Active',
      href: '/templates',
    },
    {
      id: 't4',
      name: 'lead_qualification_bot',
      channel: 'Calling',
      preview: 'Hi {{1}}, I am calling from Capermint regarding your inquiry about dual-channel automation.',
      status: 'Active',
      href: '/templates',
    },
  ]);

  useEffect(() => {
    // Optionally fetch live dashboard overview from backend
    apiClient.get('/dashboard')
      .then((res) => {
        if (res.data?.data) {
          const d = res.data.data;
          setStats((prev) => ({
            ...prev,
            totalUsers: d.totalContacts || prev.totalUsers,
            totalCampaigns: d.totalCampaigns || prev.totalCampaigns,
            ongoingCampaigns: d.activeCampaigns || prev.ongoingCampaigns,
            completedMessages: d.messagesDelivered || prev.completedMessages,
            completedCalls: d.completedCalls || prev.completedCalls,
          }));
        }
      })
      .catch(() => {
        // Fallback to seeded demo numbers
      });
  }, []);

  const statusClass = (status) => {
    switch (status) {
      case 'Ongoing':
      case 'Active':
        return 'bg-emerald-100 text-emerald-700';
      case 'Scheduled':
        return 'bg-violet-100 text-violet-700';
      case 'Completed':
        return 'bg-blue-100 text-blue-700';
      case 'Failed':
        return 'bg-red-100 text-red-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const statItems = [
    { label: 'Total Users', value: stats.totalUsers, hint: '+3.2% this month', hintClass: 'text-emerald-600', icon: Users, iconBg: 'bg-blue-50 text-[#007BFF]' },
    { label: 'Recent Users', value: stats.recentUsers, hint: '+12 shown', hintClass: 'text-emerald-600', icon: UserRound, iconBg: 'bg-blue-50 text-[#007BFF]' },
    { label: 'Total Campaigns', value: stats.totalCampaigns, hint: null, icon: Megaphone, iconBg: 'bg-violet-50 text-violet-600' },
    { label: 'Ongoing Campaigns', value: stats.ongoingCampaigns, hint: null, icon: Activity, iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Completed Messages', value: stats.completedMessages, hint: null, icon: MessageSquare, iconBg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Failed Messages', value: stats.failedMessages, hint: null, icon: CircleAlert, iconBg: 'bg-red-50 text-red-500' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* 4 Big Action Cards matching omnichannel-saas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          onClick={() => setCampaignChoiceOpen(true)}
          className="rounded-2xl bg-[#007BFF] text-white p-5 text-left min-h-[132px] hover:bg-[#0069d9] transition-colors shadow-sm cursor-pointer"
          data-testid="card-create-campaign"
        >
          <Plus className="h-8 w-8 mb-5" strokeWidth={2.5} />
          <p className="font-semibold text-[15px]">Create Campaign</p>
          <p className="text-xs text-white/80 mt-1">Start a new WhatsApp or calling campaign.</p>
        </button>

        <button
          onClick={() => navigate('/contacts')}
          className="rounded-2xl bg-white border border-slate-200 p-5 text-left min-h-[132px] hover:border-[#007BFF]/40 transition-colors shadow-sm cursor-pointer"
        >
          <UserPlus className="h-7 w-7 text-[#007BFF] mb-5" />
          <p className="font-semibold text-[15px] text-slate-900">Add Contact</p>
          <p className="text-xs text-slate-500 mt-1">Add the new contact list.</p>
        </button>

        <button
          onClick={() => navigate('/templates')}
          className="rounded-2xl bg-white border border-slate-200 p-5 text-left min-h-[132px] hover:border-[#007BFF]/40 transition-colors shadow-sm cursor-pointer"
        >
          <FilePlus className="h-7 w-7 text-[#007BFF] mb-5" />
          <p className="font-semibold text-[15px] text-slate-900">Create Template</p>
          <p className="text-xs text-slate-500 mt-1">Build a reusable message template.</p>
        </button>

        <button
          onClick={() => navigate('/campaigns')}
          className="rounded-2xl bg-white border border-slate-200 p-5 text-left min-h-[132px] hover:border-[#007BFF]/40 transition-colors shadow-sm cursor-pointer"
        >
          <PhoneCall className="h-7 w-7 text-[#007BFF] mb-5" />
          <p className="font-semibold text-[15px] text-slate-900">Create Calling Campaign</p>
          <p className="text-xs text-slate-500 mt-1">Set up an automated voice calling campaign.</p>
        </button>
      </div>

      {/* 6 Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {statItems.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm min-h-[108px]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value.toLocaleString()}</p>
            {stat.hint && (
              <p className={`text-[11px] font-medium mt-1 ${stat.hintClass || 'text-slate-500'}`}>{stat.hint}</p>
            )}
          </div>
        ))}
      </div>

      {/* 2 Call Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between shadow-sm min-h-[88px]">
          <div>
            <p className="text-xs text-slate-500 font-medium">Completed Calls</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.completedCalls.toLocaleString()}</p>
          </div>
          <span className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
            <PhoneCall className="h-5 w-5" />
          </span>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between shadow-sm min-h-[88px]">
          <div>
            <p className="text-xs text-slate-500 font-medium">Failed Calls</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.failedCalls.toLocaleString()}</p>
          </div>
          <span className="h-10 w-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
            <PhoneOff className="h-5 w-5" />
          </span>
        </div>
      </div>

      {/* Campaign Overview Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Campaign Overview</h2>
          <button
            onClick={() => navigate('/campaigns')}
            className="text-sm font-semibold text-[#007BFF] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sky-50/80 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-5">Campaign Name</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Audience</th>
                <th className="py-3 px-5">Progress</th>
                <th className="py-3 px-5">Created</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5 font-medium text-slate-900">{c.name}</td>
                  <td className="py-3 px-5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        c.type === 'WhatsApp' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-slate-600">{c.audience.toLocaleString()}</td>
                  <td className="py-3 px-5 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-[#007BFF] rounded-full" style={{ width: `${c.progress}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 w-8">{c.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-slate-500 text-xs">{new Date(c.created).toLocaleDateString()}</td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => navigate(c.href)}
                      className="text-sm font-semibold text-[#007BFF] hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Recent Users</h2>
          <button
            onClick={() => navigate('/contacts')}
            className="text-sm font-semibold text-[#007BFF] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sky-50/80 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-5">User</th>
                <th className="py-3 px-5">Phone Number</th>
                <th className="py-3 px-5">Campaign</th>
                <th className="py-3 px-5">Last Activity</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-slate-600 text-xs">{u.phone}</td>
                  <td className="py-3 px-5 text-slate-600 text-xs">{u.campaign}</td>
                  <td className="py-3 px-5 text-slate-600 text-xs">{u.activity}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusClass(u.status)}`}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Default Messages / Templates Table */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-base">Default Messages / Templates</h2>
          <button
            onClick={() => navigate('/templates')}
            className="text-sm font-semibold text-[#007BFF] hover:underline cursor-pointer"
          >
            View All Templates
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sky-50/80 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-5">Template Name</th>
                <th className="py-3 px-5">Channel</th>
                <th className="py-3 px-5">Preview</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-5 font-medium text-slate-900">{tpl.name}</td>
                  <td className="py-3 px-5">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        tpl.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {tpl.channel}
                    </span>
                  </td>
                  <td className="py-3 px-5 max-w-[280px] truncate text-slate-500 text-xs">{tpl.preview}</td>
                  <td className="py-3 px-5">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusClass(tpl.status)}`}>
                      {tpl.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => navigate(tpl.href)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3 w-3 text-slate-400" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Choice Modal */}
      {campaignChoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setCampaignChoiceOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Create Campaign</h3>
            <p className="text-xs text-slate-500 mt-1">Start a new WhatsApp or calling campaign.</p>

            <div className="grid gap-3 pt-5">
              <button
                className="rounded-xl border border-slate-200 p-4 text-left hover:border-[#007BFF] hover:bg-sky-50/60 transition-colors cursor-pointer group"
                onClick={() => {
                  setCampaignChoiceOpen(false);
                  navigate('/campaigns');
                }}
              >
                <p className="font-semibold text-slate-900 group-hover:text-[#007BFF] transition-colors">
                  WhatsApp campaign
                </p>
                <p className="text-xs text-slate-500 mt-1">Send messages to your audience on WhatsApp.</p>
              </button>

              <button
                className="rounded-xl border border-slate-200 p-4 text-left hover:border-[#007BFF] hover:bg-sky-50/60 transition-colors cursor-pointer group"
                onClick={() => {
                  setCampaignChoiceOpen(false);
                  navigate('/campaigns');
                }}
              >
                <p className="font-semibold text-slate-900 group-hover:text-[#007BFF] transition-colors">
                  Calling campaign
                </p>
                <p className="text-xs text-slate-500 mt-1">Set up an automated voice calling campaign.</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
