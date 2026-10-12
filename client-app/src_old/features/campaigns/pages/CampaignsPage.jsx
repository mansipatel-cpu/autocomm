import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Radio,
  FileCode,
  Users,
  MoreVertical,
  RotateCcw,
  Trash2,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const CampaignsPage = () => {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'voice' | 'deleted'
  const [campaigns, setCampaigns] = useState([]);
  const [deletedCampaigns, setDeletedCampaigns] = useState([]);
  const [stats, setStats] = useState({ whatsappCount: 14, voiceCount: 8, deletedCount: 4, activeDispatchRuns: 2 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState('whatsapp'); // 'whatsapp' | 'voice'
  const [detailsModalCampaign, setDetailsModalCampaign] = useState(null);
  const [restoreMessage, setRestoreMessage] = useState('');

  // Form State: WhatsApp Campaign (5.4)
  const [waForm, setWaForm] = useState({
    name: '',
    description: '',
    templateName: 'seasonal_promo_discount_q3',
    scheduleAt: '',
    enableAutoRetry: true,
  });

  // Form State: Auto Calling Campaign (5.5)
  const [voiceForm, setVoiceForm] = useState({
    name: '',
    campaignType: 'Lead Qualification',
    campaignGoal: '',
    agentName: 'Maya - Conversational Lead Qualifier',
    phoneNumber: '+1 (800) 459-2311 (Primary Outbound Toll Free)',
    visualFlowName: 'Interactive Multi-Turn Qualification Flow v3 (Recommended)',
    customScript: 'Hello {name}, calling from {company} to review your account.',
    enableScheduling: false,
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    timezone: 'America/New_York (EST, UTC-5)',
  });

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      if (activeTab === 'deleted') {
        const res = await apiClient.get('/campaigns/deleted', { params: { search, page, limit: 10 } });
        setDeletedCampaigns(res.data.data.campaigns);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
      } else {
        const res = await apiClient.get('/campaigns', {
          params: { channelType: activeTab, status: statusFilter, search, page, limit: 10 },
        });
        setCampaigns(res.data.data.campaigns);
        setTotalPages(res.data.data.totalPages);
        setTotal(res.data.data.total);
      }

      const statsRes = await apiClient.get('/campaigns/stats');
      setStats(statsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeTab, statusFilter, search, page]);

  const handleCreateWhatsApp = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/campaigns/whatsapp', waForm);
      setIsCreateModalOpen(false);
      setWaForm({ name: '', description: '', templateName: 'seasonal_promo_discount_q3', scheduleAt: '', enableAutoRetry: true });
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.error || 'Campaign name is required');
    }
  };

  const handleCreateVoice = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/campaigns/voice', {
        name: voiceForm.name,
        campaignType: voiceForm.campaignType,
        campaignGoal: voiceForm.campaignGoal,
        agentName: voiceForm.agentName,
        phoneNumber: voiceForm.phoneNumber,
        visualFlowName: voiceForm.visualFlowName,
        customScript: voiceForm.customScript,
        callScheduling: {
          enabled: voiceForm.enableScheduling,
          startTime: voiceForm.startTime,
          endTime: voiceForm.endTime,
          timezone: voiceForm.timezone,
        },
      });
      setIsCreateModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      alert(err.response?.data?.error || 'Campaign name is required');
    }
  };

  const handleDeleteCampaign = async (id) => {
    try {
      await apiClient.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (err) {
      alert('Failed to delete campaign');
    }
  };

  const handleRestoreCampaign = async (id) => {
    try {
      const res = await apiClient.post(`/campaigns/${id}/restore`);
      setRestoreMessage(res.data.message || 'Campaign Restored - The campaign has been reactivated with templates and contacts intact.');
      fetchCampaigns();
    } catch (err) {
      alert('Failed to restore campaign');
    }
  };

  const openDetails = async (campaign) => {
    try {
      const res = await apiClient.get(`/campaigns/${campaign._id}`);
      setDetailsModalCampaign(res.data.data);
    } catch (err) {
      setDetailsModalCampaign({ campaign, recipients: [] });
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Action Bar with Breadcrumbs & Action Button matching omnichannel-saas */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <span className="hover:text-slate-600 cursor-pointer" onClick={() => window.location.href = '/dashboard'}>Dashboard</span>
          <span>&gt;</span>
          <span className="text-slate-600 font-medium">Campaigns</span>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 px-4 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          data-testid="button-create-campaign"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </button>
      </div>

      {restoreMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{restoreMessage}</span>
          </div>
          <button onClick={() => setRestoreMessage('')} className="text-emerald-700 font-bold p-1 hover:bg-emerald-100 rounded">✕</button>
        </div>
      )}

      {/* Tabs with count badges & active runs matching omnichannel-saas */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-t border-b border-slate-200 pt-3">
        <div className="flex items-center gap-6 lg:gap-8 overflow-x-auto overflow-y-hidden [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => { setActiveTab('whatsapp'); setPage(1); }}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'whatsapp'
                ? 'border-[#007BFF] text-[#007BFF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone className="h-4 w-4" />
            <span>WhatsApp Campaigns</span>
            <span
              className={`rounded-md min-w-6 h-6 px-1.5 flex items-center justify-center text-[11px] font-semibold ${
                activeTab === 'whatsapp' ? 'bg-blue-50 text-[#007BFF]' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {stats.whatsappCount || 14}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('voice'); setPage(1); }}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'voice'
                ? 'border-[#007BFF] text-[#007BFF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>Auto Calling Campaigns</span>
            <span
              className={`rounded-md min-w-6 h-6 px-1.5 flex items-center justify-center text-[11px] font-semibold ${
                activeTab === 'voice' ? 'bg-blue-50 text-[#007BFF]' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {stats.voiceCount || 8}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('deleted'); setPage(1); }}
            className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'deleted'
                ? 'border-[#007BFF] text-[#007BFF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Deleted Campaigns</span>
            <span
              className={`rounded-md min-w-6 h-6 px-1.5 flex items-center justify-center text-[11px] font-semibold ${
                activeTab === 'deleted' ? 'bg-blue-50 text-[#007BFF]' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {stats.deletedCount || 4}
            </span>
          </button>
        </div>

        {activeTab === 'deleted' ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 pb-3 font-medium">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Auto-purged after 30 days</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 pb-3 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{stats.activeDispatchRuns || 2} Active Dispatch Runs</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar Card matching omnichannel-saas */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <div className="relative w-full sm:w-[280px] shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={activeTab === 'deleted' ? 'Search deleted campaigns...' : 'Search Campaign by name...'}
                className="h-10 pl-9 pr-4 w-full bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF]"
                data-testid="input-search-campaigns"
              />
            </div>

            {activeTab !== 'deleted' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#007BFF]"
              >
                <option value="all">Status: All Statuses</option>
                <option value="Ongoing">Status: Ongoing</option>
                <option value="Scheduled">Status: Scheduled</option>
                <option value="Completed">Status: Completed</option>
                <option value="Draft">Status: Draft</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Table Section matching omnichannel-saas */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === 'whatsapp' ? (
            /* WhatsApp Campaign List (5.2) */
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sky-50/80 text-slate-600 text-xs font-semibold">
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Audience / Users</th>
                  <th className="py-3 px-4">Message Template</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent</th>
                  <th className="py-3 px-4">Delivered</th>
                  <th className="py-3 px-4">Failed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={10} className="py-8 text-center text-slate-400">Loading campaigns...</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan={10} className="py-8 text-center text-slate-400">No WhatsApp campaigns found.</td></tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-semibold">
                          {c.campaignType || 'Marketing'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {c.audienceSegmentName || 'Tier-1 Users'} ({c.metrics?.totalRecipients || 0})
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{c.templateName || 'Template'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : 'Immediate'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{c.metrics?.sent || 0}</td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{c.metrics?.delivered || 0}</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{c.metrics?.failed || 0}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetails(c)}
                          className="text-blue-600 hover:text-blue-800 font-semibold mr-3"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c._id)}
                          className="text-slate-400 hover:text-rose-600 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'voice' ? (
            /* Auto Calling Campaign List (5.3) */
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sky-50/80 text-slate-600 text-xs font-semibold">
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Audience / Users</th>
                  <th className="py-3 px-4">Message Template / Script</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Calls Made</th>
                  <th className="py-3 px-4">Answered</th>
                  <th className="py-3 px-4">Failed</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={10} className="py-8 text-center text-slate-400">Loading calling campaigns...</td></tr>
                ) : campaigns.length === 0 ? (
                  <tr><td colSpan={10} className="py-8 text-center text-slate-400">No Auto Calling campaigns found.</td></tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-semibold">
                          {c.campaignType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.metrics?.totalRecipients || 0} Contacts</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] truncate max-w-xs">{c.agentName}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {c.callScheduling?.enabled ? `${c.callScheduling.startTime} - ${c.callScheduling.endTime}` : 'Immediate'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[10px] font-semibold">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {(c.metrics?.answered || 0) + (c.metrics?.failed || 0)}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-semibold">{c.metrics?.answered || 0}</td>
                      <td className="py-3 px-4 text-rose-600 font-semibold">{c.metrics?.failed || 0}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetails(c)}
                          className="text-[#007BFF] hover:underline font-semibold mr-3 cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c._id)}
                          className="text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* Deleted Campaigns (5.7) */
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-sky-50/80 text-slate-600 text-xs font-semibold">
                  <th className="py-3 px-4">Deleted Date</th>
                  <th className="py-3 px-4">Campaign Name</th>
                  <th className="py-3 px-4">Channel / Type</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4">Purge Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading deleted campaigns...</td></tr>
                ) : deletedCampaigns.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">No deleted campaigns.</td></tr>
                ) : (
                  deletedCampaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500">{c.deletedTimeAgo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.campaignCode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">{c.channelType} Broadcast</td>
                      <td className="py-3 px-4 text-slate-600">{c.metrics?.totalRecipients || 0} Contacts</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                          {c.purgeCountdown}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRestoreCampaign(c._id)}
                          className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-xs flex items-center gap-1.5 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination summary */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Showing 1-10 of {total} campaigns</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-800">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal (5.4 & 5.5) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold mb-1">Create Campaign</h2>
            <p className="text-xs text-slate-500 mb-4">Launch targeted WhatsApp broadcasts or outbound AI voice calls</p>

            {/* Campaign Channel Selector */}
            <div className="flex gap-3 mb-5">
              <button
                type="button"
                onClick={() => setCreateType('whatsapp')}
                className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                  createType === 'whatsapp'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">WhatsApp Campaign</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Meta Cloud API HSM template dispatches</div>
              </button>
              <button
                type="button"
                onClick={() => setCreateType('voice')}
                className={`flex-1 p-3 rounded-xl border text-left transition-all ${
                  createType === 'voice'
                    ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">Auto Calling Campaign</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Automated conversational AI voice calls</div>
              </button>
            </div>

            {createType === 'whatsapp' ? (
              /* WhatsApp Campaign Form (5.4) */
              <form onSubmit={handleCreateWhatsApp} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Sale Announcement"
                    value={waForm.name}
                    onChange={(e) => setWaForm({ ...waForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Campaign objectives and notes..."
                    value={waForm.description}
                    onChange={(e) => setWaForm({ ...waForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Template - Select Template</label>
                  <select
                    value={waForm.templateName}
                    onChange={(e) => setWaForm({ ...waForm, templateName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="seasonal_promo_discount_q3">seasonal_promo_discount_q3 (Approved)</option>
                    <option value="welcome_onboarding_v1">welcome_onboarding_v1 (Approved)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">Your channel's WhatsApp messaging limit is Unlimited (UNKNOWN).</p>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Schedule Campaign (Optional)</label>
                  <input
                    type="datetime-local"
                    value={waForm.scheduleAt}
                    onChange={(e) => setWaForm({ ...waForm, scheduleAt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waForm.enableAutoRetry}
                      onChange={(e) => setWaForm({ ...waForm, enableAutoRetry: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span className="font-medium text-slate-700">Enable auto-retry for failed messages</span>
                  </label>
                  <p className="text-[10px] text-slate-400 pl-6 mt-0.5">
                    Automatically retries failed dispatches via alternative SMS or Voice fallback after 15 mins.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0066FF] hover:bg-blue-600 text-white rounded-lg font-semibold"
                  >
                    Start Campaign
                  </button>
                </div>
              </form>
            ) : (
              /* Auto Calling Campaign Form (5.5) */
              <form onSubmit={handleCreateVoice} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Q1 Inbound Lead Outreach"
                    value={voiceForm.name}
                    onChange={(e) => setVoiceForm({ ...voiceForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">Campaign Type</label>
                    <select
                      value={voiceForm.campaignType}
                      onChange={(e) => setVoiceForm({ ...voiceForm, campaignType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                    >
                      <option value="Lead Qualification">Lead Qualification</option>
                      <option value="Feedback Collection">Feedback Collection</option>
                      <option value="Billing Outreach">Billing Outreach</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Select Agent *</label>
                    <select
                      value={voiceForm.agentName}
                      onChange={(e) => setVoiceForm({ ...voiceForm, agentName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                    >
                      <option value="Maya - Conversational Lead Qualifier">Maya - Conversational Lead Qualifier</option>
                      <option value="Bella - Customer Support Agent">Bella - Customer Support Agent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Outbound Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={voiceForm.phoneNumber}
                    onChange={(e) => setVoiceForm({ ...voiceForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Custom Script (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Supports variables such as {name} and {company}"
                    value={voiceForm.customScript}
                    onChange={(e) => setVoiceForm({ ...voiceForm, customScript: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0066FF] hover:bg-blue-600 text-white rounded-lg font-semibold"
                  >
                    Create Campaign
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Campaign Details Modal (5.6) */}
      {detailsModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailsModalCampaign(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                  Campaign ID: {detailsModalCampaign.campaign.campaignCode}
                </span>
                <h2 className="text-xl font-bold text-slate-900">{detailsModalCampaign.campaign.name}</h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Total Recipients</span>
                <span className="text-base font-bold text-slate-900">
                  {detailsModalCampaign.campaign.metrics?.totalRecipients || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Dispatched / Sent</span>
                <span className="text-base font-bold text-blue-600">
                  {detailsModalCampaign.campaign.metrics?.sent || detailsModalCampaign.campaign.metrics?.answered || 0}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Delivery Rate</span>
                <span className="text-base font-bold text-emerald-600">98.2%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Read / Answer Rate</span>
                <span className="text-base font-bold text-teal-600">84.5%</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Failure Rate</span>
                <span className="text-base font-bold text-rose-600">
                  {detailsModalCampaign.campaign.metrics?.failed || 0}
                </span>
              </div>
            </div>

            {/* Recipient Details (list) */}
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Recipient Log</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase text-slate-400 font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Number</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Error Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {detailsModalCampaign.recipients?.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-400">No contacts added to this campaign yet</td></tr>
                  ) : (
                    detailsModalCampaign.recipients.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-4 font-medium">{r.name}</td>
                        <td className="py-2 px-4 font-mono text-[11px]">{r.phoneNumber}</td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            r.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-slate-400 text-[11px]">{r.errorDetails || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
