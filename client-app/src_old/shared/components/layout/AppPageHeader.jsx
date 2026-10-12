import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../../../features/auth/AuthContext';

const PAGE_HEADERS = [
  { test: (p) => p === '/dashboard' || p === '/', title: 'Dashboard', subtitle: 'Overview of your communication automation.' },
  { test: (p) => p.startsWith('/campaigns'), title: 'Campaigns', subtitle: 'Create and manage your WhatsApp and automated calling campaigns.' },
  { test: (p) => p.startsWith('/contacts'), title: 'Users', subtitle: 'Manage and view all registered platform users and contact records.' },
  { test: (p) => p.startsWith('/inbox') || p.startsWith('/team-inbox') || p.startsWith('/message/inbox'), title: 'Team Inbox', subtitle: 'Reply to WhatsApp conversations in one place.' },
  { test: (p) => p.startsWith('/api-docs') || p.startsWith('/api-keys') || p.startsWith('/message/api-docs'), title: 'API Documentation', subtitle: 'Integrate WhatsApp messaging into your apps.' },
  { test: (p) => p.startsWith('/agents'), title: 'AI Agents', subtitle: 'Create and manage your conversational AI agents' },
  { test: (p) => p.startsWith('/knowledge-base'), title: 'Knowledge Base', subtitle: 'Train your AI agents with custom knowledge' },
  { test: (p) => p.startsWith('/voices') || p.startsWith('/voice-library'), title: 'Voice', subtitle: 'Choose and preview voices for calling.' },
  { test: (p) => p.startsWith('/calls'), title: 'Calls', subtitle: 'Browse inbound and outbound call history.' },
  { test: (p) => p.startsWith('/crm') || p.startsWith('/quick-crm'), title: 'Quick CRM', subtitle: 'Manage leads captured from calls and chats.' },
  { test: (p) => p.startsWith('/phone-numbers'), title: 'Phone Numbers', subtitle: 'Purchase and manage calling numbers.' },
  { test: (p) => p.startsWith('/incoming-connections'), title: 'Incoming Connections', subtitle: 'Route inbound calls to the right agent.' },
  { test: (p) => p.startsWith('/templates'), title: 'Templates', subtitle: 'Create and manage WhatsApp and AgentLab templates.' },
  { test: (p) => p.startsWith('/analytics'), title: 'Analytics', subtitle: 'Track WhatsApp and Auto Calling performance.' },
  { test: (p) => p.startsWith('/settings'), title: 'Settings', subtitle: 'Connect and manage WhatsApp Business accounts and AI settings.' },
];

function titleFromPath(path) {
  const match = PAGE_HEADERS.find((item) => item.test(path));
  if (match) return match;
  const segment = path.split('/').filter(Boolean).pop() || 'Dashboard';
  const title = segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return { title, subtitle: '' };
}

export const AppPageHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, client, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const { title, subtitle } = titleFromPath(location.pathname);
  const displayName = user?.name || 'Admin User';
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' || user?.role === 'Admin' ? 'Admin' : 'User';

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900" data-testid="text-page-title">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search..."
            className="h-10 w-56 pl-10 pr-4 rounded-md bg-white border border-slate-200 shadow-xs text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] transition-all"
            data-testid="input-app-header-search"
          />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="hidden sm:flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-slate-200/50 transition-colors focus:outline-none"
          >
            <div className="h-9 w-9 rounded-md bg-[#007BFF] text-white flex items-center justify-center text-sm font-semibold shadow-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="leading-tight text-left">
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="text-[11px] text-slate-500">{roleLabel}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-xs text-slate-700 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900 text-sm">{displayName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                {client?.companyName && (
                  <p className="text-[10px] text-teal-600 font-medium mt-0.5">{client.companyName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer text-left"
              >
                <User className="h-4 w-4 text-slate-400" />
                <span>Profile & Settings</span>
              </button>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
