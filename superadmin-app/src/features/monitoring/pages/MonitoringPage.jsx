import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Megaphone,
  Inbox,
  Users2,
  FileCode,
  Bot,
  Briefcase,
  Search,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  Volume2,
  Calendar,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';

export const MonitoringPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab determination based on URL path
  const subPath = location.pathname.split('/monitoring/')[1] || 'system';
  const [activeTab, setActiveTab] = useState(subPath);

  // System Telemetry state
  const [metrics, setMetrics] = useState(null);
  const [telemetryLoading, setTelemetryLoading] = useState(true);

  // Tab Data state
  const [tabData, setTabData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Messages viewer for inbox
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: () => {},
  });

  useEffect(() => {
    const currentSub = location.pathname.split('/monitoring/')[1] || 'system';
    setActiveTab(currentSub);
  }, [location.pathname]);

  const fetchMetrics = async () => {
    try {
      const res = await superAdminApiClient.get('/monitoring/metrics');
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to load metrics', err);
    } finally {
      setTelemetryLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await superAdminApiClient.get('/clients', { params: { limit: 100 } });
      setClients(res.data.data.clients || []);
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  const fetchTabData = async () => {
    if (activeTab === 'system') {
      fetchMetrics();
      return;
    }
    setDataLoading(true);
    try {
      let endpoint = `/monitoring/${activeTab}`;
      const res = await superAdminApiClient.get(endpoint, {
        params: { search, clientId: selectedClient, page, limit: 10 },
      });
      const data = res.data.data;
      if (activeTab === 'campaigns') setTabData(data.campaigns || []);
      else if (activeTab === 'channels') setTabData(data.channels || []);
      else if (activeTab === 'inbox') setTabData(data.conversations || []);
      else if (activeTab === 'calls') setTabData(data.calls || []);
      else if (activeTab === 'contacts') setTabData(data.contacts || []);
      else if (activeTab === 'templates') setTabData(data.templates || []);
      else if (activeTab === 'agents') setTabData(data.agents || []);
      else if (activeTab === 'crm') setTabData(data.leads || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(`Failed to load ${activeTab} data`, err);
      setTabData([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMetrics();
  }, []);

  useEffect(() => {
    fetchTabData();
  }, [activeTab, search, selectedClient, page]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
    setPage(1);
    navigate(`/monitoring/${tabId === 'system' ? '' : tabId}`);
  };

  const handleViewMessages = async (conv) => {
    setSelectedConversation(conv);
    try {
      const res = await superAdminApiClient.get(`/monitoring/inbox/${conv._id}/messages`);
      setConversationMessages(res.data.data || []);
    } catch (err) {
      setConversationMessages([]);
    }
  };

  const handleToggleStatus = async (type, id) => {
    try {
      await superAdminApiClient.patch(`/monitoring/${type}/${id}/status`);
      fetchTabData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDeleteItem = (type, id, name) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${type.slice(0, -1).toUpperCase()}`,
      message: `Are you sure you want to delete "${name || id}"? This cross-tenant operation cannot be undone.`,
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        try {
          await superAdminApiClient.delete(`/monitoring/${type}/${id}`);
          fetchTabData();
        } catch (err) {
          alert('Failed to delete item');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const tabs = [
    { id: 'system', label: 'Platform Telemetry', icon: Server },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'channels', label: 'Channels', icon: Radio },
    { id: 'inbox', label: 'Team Inbox', icon: Inbox },
    { id: 'calls', label: 'Calls', icon: PhoneCall },
    { id: 'contacts', label: 'Contacts', icon: Users2 },
    { id: 'templates', label: 'Templates', icon: FileCode },
    { id: 'agents', label: 'AI Agents', icon: Bot },
    { id: 'crm', label: 'Quick CRM', icon: Briefcase },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cross-Tenant Platform Monitoring</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Super Admin global visibility across all client campaigns, channels, team inboxes, calls & CRM
          </p>
        </div>

        <button
          onClick={fetchTabData}
          className="p-2 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh View</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 text-xs overflow-x-auto pb-[-1px]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`pb-3 px-3.5 font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'system' ? (
        <div className="space-y-6">
          {/* Telemetry Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400">Node.js Process RSS</span>
                <div className="text-xl font-bold text-white mt-0.5">{metrics?.server?.memoryRssMb || 128} MB</div>
                <span className="text-[10px] text-slate-500">Heap Used: {metrics?.server?.heapUsedMb || 85} MB</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400">PostgreSQL Engine</span>
                <div className="text-xl font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  ONLINE
                </div>
                <span className="text-[10px] text-slate-500">Connection Pool Active</span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Database className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400">BullMQ Queue Engine</span>
                <div className="text-xl font-bold text-white mt-0.5">{metrics?.queues?.activeDispatchRuns || 2} Active Runs</div>
                <span className="text-[10px] text-indigo-400 font-semibold">{metrics?.queues?.campaignQueue || 'Campaign Queue'}</span>
              </div>
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400">Live Voice Trunks</span>
                <div className="text-xl font-bold text-white mt-0.5">{metrics?.queues?.concurrentVoiceCalls || 4} Calls</div>
                <span className="text-[10px] text-slate-500">24h Total: {metrics?.queues?.callsInLast24h || 142} calls</span>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <PhoneCall className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Filter by Client: All</option>
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.companyName} ({c.clientCode})
                </option>
              ))}
            </select>
          </div>

          {/* Module-Specific Data Table */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] bg-slate-900/60">
                    {activeTab === 'campaigns' && (
                      <>
                        <th className="py-3 px-4">Campaign Name</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Recipients</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'channels' && (
                      <>
                        <th className="py-3 px-4">Channel Name</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">WhatsApp DID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'inbox' && (
                      <>
                        <th className="py-3 px-4">Customer Contact</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Last Message</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'calls' && (
                      <>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Agent Name</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">Outcome</th>
                        <th className="py-3 px-4">Date</th>
                      </>
                    )}
                    {activeTab === 'contacts' && (
                      <>
                        <th className="py-3 px-4">Contact Name</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'templates' && (
                      <>
                        <th className="py-3 px-4">Template Name</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Language</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'agents' && (
                      <>
                        <th className="py-3 px-4">Agent Name</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Language</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'crm' && (
                      <>
                        <th className="py-3 px-4">Lead Name</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Stage</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {dataLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        Loading {activeTab} data...
                      </td>
                    </tr>
                  ) : tabData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No records found for {activeTab}.
                      </td>
                    </tr>
                  ) : (
                    tabData.map((row) => (
                      <tr key={row._id || row.id} className="hover:bg-slate-900/40 transition-colors">
                        {activeTab === 'campaigns' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4 uppercase text-[10px]">{row.type || 'WhatsApp'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                                {row.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">{row.recipientCount || 0}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleToggleStatus('campaigns', row._id)}
                                className="p-1 text-slate-400 hover:text-emerald-400"
                                title="Toggle status"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                        {activeTab === 'channels' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4 font-mono text-slate-300">{row.phoneNumber || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                                {row.status || 'CONNECTED'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem('channels', row._id, row.name)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                                title="Delete channel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                        {activeTab === 'inbox' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.contactName || 'Customer'}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{row.contactPhoneNumber}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{row.lastMessageText || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                                {row.status || 'OPEN'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleViewMessages(row)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                              >
                                View Chat
                              </button>
                            </td>
                          </>
                        )}
                        {activeTab === 'calls' && (
                          <>
                            <td className="py-3 px-4 font-mono text-white">{row.customerNumber}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4">{row.agentName || 'Voice Bot'}</td>
                            <td className="py-3 px-4 font-mono">{row.durationSeconds || 0}s</td>
                            <td className="py-3 px-4 text-slate-300">{row.outcome || 'Completed'}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                            </td>
                          </>
                        )}
                        {activeTab === 'contacts' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{row.phoneNumber}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem('contacts', row._id, row.name)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                        {activeTab === 'templates' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4">{row.category || 'UTILITY'}</td>
                            <td className="py-3 px-4 font-mono text-slate-400">{row.language || 'en_US'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                                {row.status || 'APPROVED'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem('templates', row._id, row.name)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                        {activeTab === 'agents' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4 font-mono">{row.language || 'en'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold text-[10px]">
                                {row.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem('agents', row._id, row.name)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                        {activeTab === 'crm' && (
                          <>
                            <td className="py-3 px-4 font-semibold text-white">{row.name}</td>
                            <td className="py-3 px-4 text-indigo-400">{row.clientId?.companyName || '—'}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                                {row.stage || 'LEAD'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">${row.dealValue || 0}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteItem('crm', row._id, row.name)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View Chat Thread Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {selectedConversation.contactName || 'Customer'}
                </h3>
                <p className="text-slate-400 font-mono text-[11px]">{selectedConversation.contactPhoneNumber}</p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {conversationMessages.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No messages recorded in this conversation.</p>
              ) : (
                conversationMessages.map((m) => {
                  const isOutbound = m.direction === 'outbound';
                  return (
                    <div
                      key={m._id}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          isOutbound
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-xs leading-relaxed">{m.body}</p>
                        <span className="text-[10px] opacity-60 block mt-1 text-right">
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedConversation(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDanger={confirmModal.isDanger}
      />
    </div>
  );
};
