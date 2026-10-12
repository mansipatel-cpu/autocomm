import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  X,
  Mic2,
  FileText,
  MessageCircle,
  Phone,
  TrendingUp,
  RotateCw,
  Play,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const TemplatesPage = () => {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp' | 'agentlab'
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState({ whatsappCount: 32, voiceCount: 16, total: 48, dispatchSuccess: '99.4%' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);

  // Modals
  const [isWhatwayModalOpen, setIsWhatwayModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Whatway Form State
  const [whatwayForm, setWhatwayForm] = useState({
    name: 'seasonal_promo_discount_q3',
    category: 'Marketing',
    language: 'English (US)',
    marketingType: 'Custom Promotional',
    headerFormat: 'Text',
    headerText: 'Exclusive VIP Summer Offer',
    bodyText: 'Hello {{1}}, use coupon {{2}} to get 30% off your next purchase. Valid until {{3}}.',
    footerText: 'Reply STOP to unsubscribe.',
    sample1: 'Sarah Jenkins',
    sample2: 'SAVE30',
    sample3: 'June 30',
    buttons: [{ type: 'URL', text: 'Redeem Now', url: 'https://autocomm.io/redeem' }],
  });

  // Voice Form State
  const [voiceForm, setVoiceForm] = useState({
    name: 'agentlab_balance_reminder_v2',
    category: 'Voice Call / Billing & Collections',
    synthesisLanguage: 'English (US) - Neutral',
    description: 'Reminder for overdue payments with immediate payment transfer',
    firstMessage: 'Hello {{first_name}}, this is AutoComm regarding your pending balance of {{amount}} due on {{due_date}}.',
    prompt: 'Maintain professional and firm tone while offering payment plan assistance.',
    voiceTone: 'Professional',
    personality: 'Financial Advisor',
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const type = activeTab === 'whatsapp' ? 'whatsapp' : 'voice';
      const res = await apiClient.get('/templates', {
        params: { type, category: categoryFilter, status: statusFilter, search },
      });
      setTemplates(res.data.data.templates || []);

      const statsRes = await apiClient.get('/templates/stats');
      if (statsRes.data.data) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeTab, categoryFilter, statusFilter, search]);

  const handleSyncMeta = async () => {
    setSyncing(true);
    try {
      await apiClient.post('/templates/sync-meta');
      alert('Synchronized templates with Meta Cloud API');
      fetchTemplates();
    } catch (err) {
      alert('Meta sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateWhatway = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/templates/whatsapp', {
        name: whatwayForm.name,
        category: whatwayForm.category,
        language: whatwayForm.language,
        marketingType: whatwayForm.marketingType,
        headerFormat: whatwayForm.headerFormat,
        headerText: whatwayForm.headerText,
        bodyText: whatwayForm.bodyText,
        footerText: whatwayForm.footerText,
        sampleParameters: {
          '1': whatwayForm.sample1,
          '2': whatwayForm.sample2,
          '3': whatwayForm.sample3,
        },
        buttons: whatwayForm.buttons,
      });
      setIsWhatwayModalOpen(false);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit template to Meta');
    }
  };

  const handleCreateVoice = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/templates/voice', voiceForm);
      setIsVoiceModalOpen(false);
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create voice template');
    }
  };

  const renderBodyWithVariables = (text = '') => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 rounded-md bg-blue-100 text-[#007BFF] font-semibold text-[11px] mx-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <a href="/dashboard" className="hover:text-slate-600 transition-colors">Home</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Templates</span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'whatsapp' && (
            <button
              onClick={handleSyncMeta}
              disabled={syncing}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#007BFF] text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              Sync Meta API
            </button>
          )}
          <button
            onClick={() => {
              if (activeTab === 'whatsapp') setIsWhatwayModalOpen(true);
              else setIsVoiceModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>
      </div>

      {/* Tabs Switcher with count pills */}
      <div className="border-b border-slate-200 pb-3">
        <div className="inline-flex rounded-xl bg-[#F4F6F8] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-white text-[#007BFF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Whatway Template
            <span
              className={`min-w-6 h-6 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                activeTab === 'whatsapp' ? 'bg-blue-50 text-[#007BFF]' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {stats.whatsappCount || 32}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('agentlab')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              activeTab === 'agentlab'
                ? 'bg-[#007BFF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="h-4 w-4" />
            AgentLab Template
            <span
              className={`min-w-6 h-6 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                activeTab === 'agentlab' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {stats.voiceCount || 16}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards (Dynamic WhatsApp vs AgentLab mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {activeTab === 'whatsapp' ? (
          <>
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Templates</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">
                    {(stats.whatsappCount || 32) + (stats.voiceCount || 16)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">WhatsApp + AgentLab</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Whatway WhatsApp</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">{stats.whatsappCount || 32}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    96.8% Meta Approved
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">AgentLab Voice</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">{stats.voiceCount || 16}</p>
                  <p className="text-xs text-slate-500 mt-2">12 Active Trunks</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Dispatch Success</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">{stats.dispatchSuccess || '99.4%'}</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Delivered vs sent</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Voice Templates</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">{stats.voiceCount || 16}</p>
                  <p className="text-xs text-violet-600 mt-2 font-medium">IVR & Outbound Calling</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Phone className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Trunks</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">12</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Sip Gateways Operational</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Synthesized Minutes</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">4,820</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">+18% this month</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center">
                  <Mic2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Engine Readiness</p>
                  <p className="text-[28px] font-bold text-slate-900 mt-1">99.8%</p>
                  <p className="text-xs text-emerald-600 mt-2 font-medium">Zero TTS latencies</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative w-full lg:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === 'whatsapp' ? 'Filter templates...' : 'Search voice scripts...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007BFF]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-full lg:w-[170px] px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#007BFF]"
          >
            <option value="all">Category: All</option>
            <option value="Marketing">Marketing</option>
            <option value="Utility / Onboarding">Utility / Onboarding</option>
            <option value="Transactional">Transactional</option>
            <option value="Authentication">Authentication</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 w-full lg:w-[170px] px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#007BFF]"
          >
            <option value="all">Status: All</option>
            <option value="Approved">Approved</option>
            <option value="In Review">In Review</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* Templates Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold">
              <tr>
                <th className="py-3 px-4">
                  {activeTab === 'whatsapp' ? 'Last Modified' : 'Duration / Status'}
                </th>
                <th className="py-3 px-4">
                  {activeTab === 'whatsapp' ? 'Template Spec & Preview' : 'Voice Template Spec & TTS Preview'}
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">
                  {activeTab === 'whatsapp' ? 'Language' : 'Voice & Language'}
                </th>
                <th className="py-3 px-4">
                  {activeTab === 'whatsapp' ? 'Meta Status' : 'Engine Status'}
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading templates...</td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No templates found.</td>
                </tr>
              ) : (
                templates.map((tpl) => (
                  <tr key={tpl._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(tpl.updatedAt || tpl.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-slate-900 text-xs">{tpl.name}</div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {renderBodyWithVariables(tpl.bodyText || tpl.firstMessage)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {tpl.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 text-[11px]">
                        {tpl.language || tpl.synthesisLanguage || 'EN (US)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {tpl.status === 'Approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-200">
                          Approved
                        </span>
                      ) : tpl.status === 'In Review' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200">
                          In Review
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium text-[11px] border border-teal-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setPreviewTemplate(tpl)}
                        className="text-[#007BFF] hover:text-[#0069d9] font-medium text-xs mr-3"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete template "${tpl.name}"?`)) {
                            apiClient.delete(`/templates/${tpl._id}`).then(() => fetchTemplates());
                          }
                        }}
                        className="text-rose-500 hover:text-rose-700 font-medium text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Smartphone Dialog */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Message Preview</h3>
              </div>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated WhatsApp Chat Bubble */}
            <div className="p-4 rounded-2xl bg-[#EFEAE2] min-h-[220px] flex flex-col justify-end">
              <div className="bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-xs space-y-1.5 max-w-[90%] self-start border border-slate-100">
                {previewTemplate.headerText && (
                  <div className="font-bold text-slate-900">{previewTemplate.headerText}</div>
                )}
                <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewTemplate.bodyText || previewTemplate.firstMessage}
                </div>
                {previewTemplate.footerText && (
                  <div className="text-[10px] text-slate-400">{previewTemplate.footerText}</div>
                )}
                <div className="text-[9px] text-slate-400 text-right">10:42 AM · Sent</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-[#007BFF] text-white text-xs font-medium rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Whatway Modal */}
      {isWhatwayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add WhatsApp (Whatway) Template</h2>
              <button onClick={() => setIsWhatwayModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWhatway} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Template Name (lowercase, no spaces)</label>
                  <input
                    type="text"
                    required
                    value={whatwayForm.name}
                    onChange={(e) => setWhatwayForm({ ...whatwayForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={whatwayForm.category}
                    onChange={(e) => setWhatwayForm({ ...whatwayForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Utility">Utility</option>
                    <option value="Authentication">Authentication</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Header Text (Optional)</label>
                <input
                  type="text"
                  value={whatwayForm.headerText}
                  onChange={(e) => setWhatwayForm({ ...whatwayForm, headerText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Body Text (Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125; for dynamic variables)
                </label>
                <textarea
                  rows={4}
                  required
                  value={whatwayForm.bodyText}
                  onChange={(e) => setWhatwayForm({ ...whatwayForm, bodyText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Footer Text (Optional)</label>
                <input
                  type="text"
                  value={whatwayForm.footerText}
                  onChange={(e) => setWhatwayForm({ ...whatwayForm, footerText: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWhatwayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium"
                >
                  Submit to Meta API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Voice Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add AgentLab Voice Template</h2>
              <button onClick={() => setIsVoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoice} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={voiceForm.name}
                  onChange={(e) => setVoiceForm({ ...voiceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Spoken Greeting</label>
                <textarea
                  rows={3}
                  required
                  value={voiceForm.firstMessage}
                  onChange={(e) => setVoiceForm({ ...voiceForm, firstMessage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium"
                >
                  Create Voice Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
