import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Megaphone,
  Users,
  MessageSquare,
  Phone,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  Zap,
  BookOpen,
  Headset,
  AudioLines,
  ContactRound,
  Grid3x3,
  Link2,
  Inbox,
} from 'lucide-react';

const messagesItems = [
  { title: 'Team Inbox', url: '/inbox', altUrl: '/team-inbox', icon: Inbox },
  { title: 'API Documentation', url: '/api-docs', altUrl: '/api-keys', icon: FileText },
];

const autoCallingItems = [
  { title: 'Agents', url: '/agents', icon: Headset },
  { title: 'Knowledge Base', url: '/knowledge-base', icon: BookOpen },
  { title: 'Voice', url: '/voices', altUrl: '/voice-library', icon: AudioLines },
  { title: 'Calls', url: '/calls', icon: Phone },
  { title: 'Quick CRM', url: '/crm', altUrl: '/quick-crm', icon: ContactRound },
  { title: 'Phone Numbers', url: '/phone-numbers', icon: Grid3x3 },
  { title: 'Incoming Connections', url: '/incoming-connections', icon: Link2 },
];

function pathMatches(pathname, targetUrl, altUrl) {
  if (pathname === targetUrl || (altUrl && pathname === altUrl)) return true;
  if (targetUrl !== '/' && pathname.startsWith(targetUrl + '/')) return true;
  if (altUrl && pathname.startsWith(altUrl + '/')) return true;
  return false;
}

export const Sidebar = () => {
  const location = useLocation();
  const [messagesOpen, setMessagesOpen] = useState(true);
  const [autoCallingOpen, setAutoCallingOpen] = useState(true);

  useEffect(() => {
    if (messagesItems.some((item) => pathMatches(location.pathname, item.url, item.altUrl))) {
      setMessagesOpen(true);
    }
    if (autoCallingItems.some((item) => pathMatches(location.pathname, item.url, item.altUrl))) {
      setAutoCallingOpen(true);
    }
  }, [location.pathname]);

  const itemClass = (isActive) =>
    `flex items-center gap-3 w-full h-10 px-3 rounded-lg text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-[#007BFF] text-white hover:bg-[#007BFF] hover:text-white shadow-xs'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
    }`;

  const subItemClass = (isActive) =>
    `flex items-center gap-2.5 w-full h-8 px-3 rounded-lg text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-[#007BFF]/20 text-white font-semibold'
        : 'text-slate-400 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-[#1A2233] flex flex-col h-screen select-none shrink-0 overflow-y-auto border-r-0">
      {/* Brand Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2.5 min-w-0 text-left">
          <div className="h-9 w-9 rounded-lg bg-[#007BFF] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold text-white truncate">AutoComm</p>
            <p className="text-[11px] text-slate-400">Platform</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-0.5">
        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Main Menu
        </div>

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => itemClass(isActive || location.pathname === '/')}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        {/* Campaigns */}
        <NavLink
          to="/campaigns"
          className={({ isActive }) => itemClass(isActive || location.pathname.startsWith('/campaigns'))}
        >
          <Megaphone className="h-4 w-4 shrink-0" />
          <span>Campaigns</span>
        </NavLink>

        {/* Contacts */}
        <NavLink
          to="/contacts"
          className={({ isActive }) => itemClass(isActive || location.pathname.startsWith('/contacts'))}
        >
          <Users className="h-4 w-4 shrink-0" />
          <span>Contacts</span>
        </NavLink>

        {/* Messages Group */}
        <div>
          <button
            type="button"
            onClick={() => setMessagesOpen(!messagesOpen)}
            className="flex items-center justify-between w-full h-10 px-3 rounded-lg text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>Messages</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${messagesOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {messagesOpen && (
            <div className="border-l border-white/10 mx-3 mt-0.5 mb-1 pl-3 space-y-0.5">
              {messagesItems.map((item) => {
                const Icon = item.icon;
                const active = pathMatches(location.pathname, item.url, item.altUrl);
                return (
                  <NavLink key={item.url} to={item.url} className={subItemClass(active)}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Auto Calling Group */}
        <div>
          <button
            type="button"
            onClick={() => setAutoCallingOpen(!autoCallingOpen)}
            className="flex items-center justify-between w-full h-10 px-3 rounded-lg text-[13px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0" />
              <span>Auto Calling</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform ${autoCallingOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {autoCallingOpen && (
            <div className="border-l border-white/10 mx-3 mt-0.5 mb-1 pl-3 space-y-0.5">
              {autoCallingItems.map((item) => {
                const Icon = item.icon;
                const active = pathMatches(location.pathname, item.url, item.altUrl);
                return (
                  <NavLink key={item.url} to={item.url} className={subItemClass(active)}>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>

        {/* Templates */}
        <NavLink
          to="/templates"
          className={({ isActive }) => itemClass(isActive || location.pathname.startsWith('/templates'))}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span>Templates</span>
        </NavLink>

        {/* Analytics */}
        <NavLink
          to="/analytics"
          className={({ isActive }) => itemClass(isActive || location.pathname.startsWith('/analytics'))}
        >
          <BarChart3 className="h-4 w-4 shrink-0" />
          <span>Analytics</span>
        </NavLink>
      </nav>

      {/* Footer Settings */}
      <div className="px-2 pb-4 pt-2 mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) => itemClass(isActive || location.pathname.startsWith('/settings'))}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
