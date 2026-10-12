import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Phone,
  BookOpen,
  CheckCircle2,
  Trash2,
  Edit,
  Power,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  Sparkles,
  PhoneCall,
  Search,
  Wand2,
  GitBranch,
  ArrowUpDown,
  Mic,
  Bot,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const AgentsPage = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'incoming', 'flow', 'cve'

  // Wizard Modal
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Wizard Form State
  const [agentForm, setAgentForm] = useState({
    name: 'Customer Support Concierge',
    type: 'incoming',
    language: 'en-US',
    voiceId: 'rachel_warm_us',
    voiceName: 'Rachel (Warm & Engaging)',
    greetingMessage: 'Hello! Thank you for contacting AutoComm. How can I help you today?',
    systemPrompt: 'You are a professional, polite, and helpful voice agent representing AutoComm. Answer customer inquiries concisely and clearly.',
    assignedPhoneNumber: '+1 (555) 849-2041',
  });

  // Test Call Modal
  const [testCallModalAgent, setTestCallModalAgent] = useState(null);
  const [testCallPhone, setTestCallPhone] = useState('+1 (555) 392-8172');
  const [triggeringCall, setTriggeringCall] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/agents');
      setAgents(res.data.data || []);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (agentId) => {
    try {
      await apiClient.put(`/agents/${agentId}/toggle-status`);
      fetchData();
    } catch (err) {
      alert('Failed to toggle agent status');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!confirm('Are you sure you want to delete this AI voice agent?')) return;
    try {
      await apiClient.delete(`/agents/${agentId}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete agent');
    }
  };

  const handleCreateAgent = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/agents', agentForm);
      setIsWizardOpen(false);
      setWizardStep(1);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriggerTestCall = async (e) => {
    e.preventDefault();
    setTriggeringCall(true);
    try {
      await apiClient.post('/calls/test-call', {
        contactPhoneNumber: testCallPhone,
        agentId: testCallModalAgent._id,
      });
      alert(`Test call placed to ${testCallPhone}! Check your phone.`);
      setTestCallModalAgent(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to initiate test call');
    } finally {
      setTriggeringCall(false);
    }
  };

  const filteredAgents = agents.filter((ag) => {
    if (typeFilter === 'incoming' && ag.type !== 'incoming') return false;
    if (typeFilter === 'flow' && ag.type !== 'flow') return false;
    if (typeFilter === 'cve' && ag.type !== 'cve') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ag.name?.toLowerCase().includes(q) || ag.type?.toLowerCase().includes(q);
    }
    return true;
  });

  const incomingCount = agents.filter((a) => a.type === 'incoming').length;
  const flowCount = agents.filter((a) => a.type === 'flow').length;
  const cveCount = agents.filter((a) => a.type === 'cve').length;

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-[#2F6BFF] flex items-center justify-center shadow-sm shrink-0">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Agents</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Create and manage your conversational AI agents
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setWizardStep(1);
                setIsWizardOpen(true);
              }}
              className="h-10 px-4 rounded-xl border border-[#2F6BFF]/40 bg-white hover:bg-blue-50 text-[#2F6BFF] text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Wand2 className="h-4 w-4" />
              Guided Wizard
            </button>
            <button
              onClick={() => {
                setWizardStep(1);
                setIsWizardOpen(true);
              }}
              className="h-10 px-4 rounded-xl bg-[#2F6BFF] hover:bg-[#1F5AEF] text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Agent
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-slate-200/80 px-5 py-4 shadow-sm">
            <div className="text-3xl font-bold text-[#2F6BFF] tabular-nums leading-none">
              {agents.length}
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Agents
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200/80 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-emerald-500 tabular-nums leading-none">
                {incomingCount}
              </div>
              <GitBranch className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Incoming
            </div>
          </div>

          <div className="rounded-xl bg-white border border-slate-200/80 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-[#2F6BFF] tabular-nums leading-none">
                {flowCount}
              </div>
              <ArrowUpDown className="h-4 w-4 text-[#2F6BFF]" />
            </div>
            <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Flow
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs w-fit">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            All ({agents.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('incoming')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'incoming'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <GitBranch className={`h-3.5 w-3.5 ${typeFilter === 'incoming' ? 'text-white' : 'text-slate-400'}`} />
            Incoming ({incomingCount})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('flow')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'flow'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <ArrowUpDown className={`h-3.5 w-3.5 ${typeFilter === 'flow' ? 'text-white' : 'text-slate-400'}`} />
            Flow ({flowCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-[#2F6BFF]"
          />
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading AI agents...</div>
      ) : filteredAgents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="h-14 w-14 mx-auto mb-4 rounded-xl bg-blue-50 flex items-center justify-center">
            <FlaskConical className="h-7 w-7 text-[#2F6BFF]" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No agents found</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Get started by launching our guided wizard to build your conversational voice bot.
          </p>
          <button
            onClick={() => {
              setWizardStep(1);
              setIsWizardOpen(true);
            }}
            className="h-10 px-5 rounded-xl bg-[#2F6BFF] hover:bg-[#1F5AEF] text-white text-sm font-medium"
          >
            Create First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const isIncoming = agent.type === 'incoming';
            const iconBg = isIncoming ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-[#2F6BFF]';
            const badgeClass = isIncoming
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-blue-50 text-[#2F6BFF] border-blue-100';

            return (
              <div
                key={agent._id}
                className="rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                        {isIncoming ? <GitBranch className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{agent.name}</h3>
                        <span className={`shrink-0 text-[11px] font-medium rounded-full px-2 py-0 border ${badgeClass}`}>
                          {agent.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setTestCallModalAgent(agent)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Test Call"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
                      <Mic className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{agent.voiceName || 'Rachel (Natural & Warm)'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400 pl-5">
                      <span>English</span>
                      <span className="text-slate-300">·</span>
                      <span>Natural</span>
                      <span className="text-slate-300">·</span>
                      <span>Professional</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium pl-5 text-[#2F6BFF]">
                      <span>≈ $0.090/min</span>
                      <span className="opacity-40">·</span>
                      <span>Ultra Low Latency</span>
                    </div>
                  </div>

                  {agent.systemPrompt && (
                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                        {agent.systemPrompt}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {agent.assignedPhoneNumber || 'No number assigned'}
                  </span>
                  <button
                    onClick={() => setTestCallModalAgent(agent)}
                    className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2F6BFF] text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Test Agent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guided Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2F6BFF] flex items-center justify-center font-bold text-xs">
                  {wizardStep}/3
                </div>
                <h2 className="text-base font-bold text-slate-900">Create Conversational AI Agent</h2>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs">
              {wizardStep === 1 && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Agent Name</label>
                    <input
                      type="text"
                      value={agentForm.name}
                      onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Agent Type</label>
                    <select
                      value={agentForm.type}
                      onChange={(e) => setAgentForm({ ...agentForm, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                    >
                      <option value="incoming">Incoming Support</option>
                      <option value="flow">Flow / Outbound Follow-up</option>
                    </select>
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Spoken Greeting</label>
                    <textarea
                      rows={3}
                      value={agentForm.greetingMessage}
                      onChange={(e) => setAgentForm({ ...agentForm, greetingMessage: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">System Personality & Grounding Prompt</label>
                    <textarea
                      rows={4}
                      value={agentForm.systemPrompt}
                      onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                    />
                  </div>
                </>
              )}

              {wizardStep === 3 && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Assigned Dedicated Phone Number</label>
                    <input
                      type="text"
                      value={agentForm.assignedPhoneNumber}
                      onChange={(e) => setAgentForm({ ...agentForm, assignedPhoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 text-xs">
                    Your AI Agent will be armed with real-time bidirectional streaming, voice interruption, and live CRM lead tracking.
                  </div>
                </>
              )}

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s - 1)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Back
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="px-5 py-2 bg-[#2F6BFF] hover:bg-[#1F5AEF] text-white rounded-xl font-medium"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCreateAgent}
                    className="px-5 py-2 bg-[#2F6BFF] hover:bg-[#1F5AEF] text-white rounded-xl font-medium disabled:opacity-60"
                  >
                    {submitting ? 'Creating...' : 'Deploy Agent'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Call Modal */}
      {testCallModalAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Trigger Test Voice Call</h3>
              </div>
              <button onClick={() => setTestCallModalAgent(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTriggerTestCall} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number to Call</label>
                <input
                  type="tel"
                  required
                  value={testCallPhone}
                  onChange={(e) => setTestCallPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-xs">
                Agent <strong>{testCallModalAgent.name}</strong> will initiate an outbound call with low-latency audio synthesis.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTestCallModalAgent(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggeringCall}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {triggeringCall ? 'Calling...' : 'Call Phone Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
