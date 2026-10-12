import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Mail,
  Users2,
  Megaphone,
  GitBranch,
  Layers,
  Inbox,
  Radio,
  Bot,
  BookOpen,
  Mic2,
  PhoneCall,
  UserCheck,
  Hash,
  Link2,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useSuperAdminAuth } from '../../../features/auth/AuthContext';

export const Sidebar = () => {
  const location = useLocation();
  const { logout, adminUser } = useSuperAdminAuth();

  const navItemClass = (path) => {
    const active = location.pathname === path;
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      active
        ? 'bg-indigo-600 text-white shadow-sm font-semibold'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    }`;
  };

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col h-screen select-none shrink-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-500/30">
          SA
        </div>
        <div>
          <span className="text-white font-bold tracking-tight text-sm">AutoComm SuperAdmin</span>
          <span className="text-[10px] block text-indigo-400 font-semibold uppercase tracking-wider">Multi-Tenant Root</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 text-xs">
        <NavLink to="/dashboard" className={navItemClass('/dashboard')}>
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </NavLink>

        <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Tenant Management
        </div>

        <NavLink to="/clients" className={navItemClass('/clients')}>
          <Building2 className="w-4 h-4" />
          <span>Client Management</span>
        </NavLink>

        <NavLink to="/client-users" className={navItemClass('/client-users')}>
          <Users2 className="w-4 h-4" />
          <span>Client Users</span>
        </NavLink>

        <NavLink to="/email-templates" className={navItemClass('/email-templates')}>
          <Mail className="w-4 h-4" />
          <span>Email Templates</span>
        </NavLink>

        <NavLink to="/flow-builder" className={navItemClass('/flow-builder')}>
          <GitBranch className="w-4 h-4" />
          <span>Visual Flow Builder</span>
        </NavLink>

        <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Cross-Tenant Monitoring
        </div>

        <NavLink to="/monitoring/campaigns" className={navItemClass('/monitoring/campaigns')}>
          <Megaphone className="w-4 h-4" />
          <span>Campaigns</span>
        </NavLink>

        <NavLink to="/monitoring/channels" className={navItemClass('/monitoring/channels')}>
          <Radio className="w-4 h-4" />
          <span>Channels & Integrations</span>
        </NavLink>

        <NavLink to="/monitoring/inbox" className={navItemClass('/monitoring/inbox')}>
          <Inbox className="w-4 h-4" />
          <span>Team Inbox</span>
        </NavLink>

        <NavLink to="/monitoring/calls" className={navItemClass('/monitoring/calls')}>
          <PhoneCall className="w-4 h-4" />
          <span>Calls & Transcripts</span>
        </NavLink>

        <NavLink to="/monitoring/phone-numbers" className={navItemClass('/monitoring/phone-numbers')}>
          <Hash className="w-4 h-4" />
          <span>Phone Numbers</span>
        </NavLink>

        <NavLink to="/reports" className={navItemClass('/reports')}>
          <BarChart3 className="w-4 h-4" />
          <span>Platform Reports</span>
        </NavLink>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-700/50">
            SA
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">{adminUser?.name || 'Super Admin'}</div>
            <div className="text-[10px] text-slate-500">Root Operator</div>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
