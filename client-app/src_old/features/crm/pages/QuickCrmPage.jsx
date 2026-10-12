import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Plus,
  Phone,
  DollarSign,
  TrendingUp,
  Tag,
  ChevronRight,
  MoreVertical,
  Trash2,
  X,
  Sparkles,
  RefreshCw,
  UserCheck,
  Flame,
  Calendar,
  ClipboardCheck,
  Clock,
  UserX,
  Users,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

const STAGE_CONFIGS = {
  NEW_LEAD: {
    label: 'New Lead',
    gradient: 'from-emerald-500 to-emerald-600',
    icon: UserCheck,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  CONTACTED: {
    label: 'Contacted',
    gradient: 'from-blue-500 to-blue-600',
    icon: Phone,
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  QUALIFIED: {
    label: 'Qualified Hot',
    gradient: 'from-orange-500 to-red-500',
    icon: Flame,
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  PROPOSAL_SENT: {
    label: 'Proposal Sent',
    gradient: 'from-purple-500 to-purple-600',
    icon: ClipboardCheck,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  WON: {
    label: 'Won Deal',
    gradient: 'from-teal-500 to-emerald-600',
    icon: TrendingUp,
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  LOST: {
    label: 'Lost / Closed',
    gradient: 'from-rose-500 to-rose-600',
    icon: UserX,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export const QuickCrmPage = () => {
  const [pipeline, setPipeline] = useState({});
  const [stages, setStages] = useState([
    'NEW_LEAD',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL_SENT',
    'WON',
    'LOST',
  ]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);

  // Add / Edit Lead Modal
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({
    contactName: '',
    phoneNumber: '+1 (555) ',
    email: '',
    dealValue: 1500,
    source: 'AgentLab Call',
    stage: 'NEW_LEAD',
    sentiment: 'Positive',
    tags: 'Hot Lead, SaaS',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/crm/pipeline');
      const data = res.data.data;
      setPipeline(data.pipeline || {});
      if (data.stages?.length) {
        setStages(data.stages);
      }
      setTotalLeads(data.totalLeads || 0);
      setTotalValue(data.totalPipelineValue || 0);
    } catch (err) {
      console.error('Failed to load CRM pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/crm/leads', {
        ...leadForm,
        dealValue: Number(leadForm.dealValue) || 0,
        tags: leadForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setIsAddLeadOpen(false);
      setLeadForm({
        contactName: '',
        phoneNumber: '+1 (555) ',
        email: '',
        dealValue: 1500,
        source: 'AgentLab Call',
        stage: 'NEW_LEAD',
        sentiment: 'Positive',
        tags: 'Hot Lead',
        notes: '',
      });
      fetchPipeline();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveStage = async (leadId, nextStage) => {
    try {
      await apiClient.put(`/crm/leads/${leadId}/stage`, { stage: nextStage });
      fetchPipeline();
    } catch (err) {
      alert('Failed to update stage');
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await apiClient.delete(`/crm/leads/${leadId}`);
      fetchPipeline();
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <a href="/dashboard" className="hover:text-slate-600 transition-colors">Home</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Quick CRM Pipeline</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPipeline()}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Refresh Pipeline
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Active Leads</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">{totalLeads}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">+8 new this week</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pipeline Value</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">
                ${totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">Weighted opportunity value</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Won Opportunities</p>
              <p className="text-[28px] font-bold text-emerald-600 mt-1">
                ${((pipeline.WON || []).reduce((acc, l) => acc + (l.dealValue || 0), 0)).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">Closed deals this quarter</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 6-Column Kanban Pipeline Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1300px]">
          {stages.map((stageKey) => {
            const config = STAGE_CONFIGS[stageKey] || {
              label: stageKey,
              gradient: 'from-slate-500 to-slate-600',
              icon: Users,
              badgeBg: 'bg-slate-100 text-slate-700',
            };
            const Icon = config.icon;
            const stageLeads = pipeline[stageKey] || [];
            const stageValue = stageLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

            return (
              <div
                key={stageKey}
                className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-sm min-h-[500px]"
              >
                {/* Column Header with Gradient */}
                <div className={`p-4 rounded-t-2xl text-white bg-gradient-to-r ${config.gradient} shadow-xs`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <h3 className="font-bold text-sm tracking-tight">{config.label}</h3>
                    </div>
                    <span className="bg-white/20 text-white font-bold text-xs px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-white/90 mt-1">
                    ${stageValue.toLocaleString()} in stage
                  </div>
                </div>

                {/* Column Cards Scrollable */}
                <div className="flex-1 p-3 space-y-3 bg-slate-50/50 rounded-b-2xl overflow-y-auto max-h-[600px]">
                  {stageLeads.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic">
                      No leads in stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs">{lead.contactName}</h4>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{lead.phoneNumber}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                              ${lead.dealValue?.toLocaleString()}
                            </span>
                          </div>

                          {lead.sentiment && (
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#007BFF] text-[10px] font-medium">
                                {lead.source || 'Voice Call'}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                                {lead.sentiment}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Stage transition buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-1">
                            {stageKey !== 'WON' && (
                              <button
                                onClick={() => {
                                  const idx = stages.indexOf(stageKey);
                                  if (idx < stages.length - 1) {
                                    handleMoveStage(lead._id, stages[idx + 1]);
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#007BFF] text-[11px] font-medium flex items-center gap-1 transition-colors"
                              >
                                <span>Advance</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add Lead Opportunity</h3>
              <button onClick={() => setIsAddLeadOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Henderson"
                  value={leadForm.contactName}
                  onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={leadForm.phoneNumber}
                    onChange={(e) => setLeadForm({ ...leadForm, phoneNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    required
                    value={leadForm.dealValue}
                    onChange={(e) => setLeadForm({ ...leadForm, dealValue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Pipeline Stage</label>
                <select
                  value={leadForm.stage}
                  onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                >
                  <option value="NEW_LEAD">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified Hot</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="WON">Won Deal</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {submitting ? 'Adding...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
