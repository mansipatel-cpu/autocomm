import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  Users,
  Play,
  ArrowRight,
  Layers,
  Sparkles,
  PhoneCall,
  MessageSquare,
  X,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const FlowBuilderPage = () => {
  const [flows, setFlows] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assign Flow Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignClientId, setAssignClientId] = useState('global');
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flowsRes, clientsRes] = await Promise.all([
        superAdminApiClient.get('/flows'),
        superAdminApiClient.get('/clients'),
      ]);
      const flowList = flowsRes.data.data || [];
      setFlows(flowList);
      setClients(clientsRes.data.data || []);
      if (flowList.length > 0 && !selectedFlow) {
        setSelectedFlow(flowList[0]);
      }
    } catch (err) {
      console.error('Failed to load flows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminApiClient.post('/flows', {
        name: newFlowName,
        description: 'Custom conversational decision tree',
      });
      setIsNewFlowModalOpen(false);
      setNewFlowName('');
      fetchData();
      setSelectedFlow(res.data.data);
    } catch (err) {
      alert('Failed to create flow');
    }
  };

  const handleAssignFlow = async () => {
    if (!selectedFlow) return;
    try {
      const res = await superAdminApiClient.put(`/flows/${selectedFlow._id}/assign`, {
        clientId: assignClientId,
      });
      setIsAssignModalOpen(false);
      fetchData();
      setSelectedFlow(res.data.data);
      alert('Flow assigned successfully!');
    } catch (err) {
      alert('Failed to assign flow');
    }
  };

  const handleDeleteFlow = async (id) => {
    if (!confirm('Are you sure you want to delete this conversation flow?')) return;
    try {
      await superAdminApiClient.delete(`/flows/${id}`);
      setSelectedFlow(null);
      fetchData();
    } catch (err) {
      alert('Failed to delete flow');
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Visual Flow Builder</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Design drag-and-drop conversational decision trees and assign pre-configured logic to client tenants
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewFlowModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create New Flow
          </button>
        </div>
      </div>

      {/* Main Builder Canvas & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left 4 Cols: Flows List */}
        <div className="lg:col-span-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Flow Templates & Deployments
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {flows.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading flow graphs...</div>
            ) : (
              flows.map((flow) => {
                const isSelected = selectedFlow?._id === flow._id;
                return (
                  <div
                    key={flow._id}
                    onClick={() => setSelectedFlow(flow)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50'
                        : 'hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs text-white">{flow.name}</h4>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.2 rounded-full font-bold">
                        Published
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                      {flow.description || 'Enterprise visual flow'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/60">
                      <span className="text-indigo-400 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {flow.assignedClientName || 'Global System Template'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flow._id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 8 Cols: Interactive Visual Canvas */}
        <div className="lg:col-span-8 bg-[#070b14] border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative">
          {selectedFlow ? (
            <>
              {/* Canvas Header */}
              <div className="p-4 border-b border-slate-800 bg-[#0a0f1d] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedFlow.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    Assigned to: <strong className="text-indigo-300">{selectedFlow.assignedClientName}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAssignClientId(selectedFlow.assignedClientId || 'global');
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Assign to Client Tenant
                  </button>
                </div>
              </div>

              {/* Node Graph Visualizer */}
              <div className="flex-1 p-6 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center space-y-4">
                {/* Node 1: Trigger */}
                <div className="w-64 p-3.5 rounded-xl bg-slate-900 border border-indigo-500/60 shadow-lg text-center space-y-1">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Play className="w-3 h-3" /> Trigger Node
                  </div>
                  <div className="font-bold text-xs text-white">Call Started / Inbound Audio Ring</div>
                </div>

                <div className="h-6 w-0.5 bg-indigo-500/50" />

                {/* Node 2: Speech & Greeting */}
                <div className="w-72 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-lg text-center space-y-1">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <PhoneCall className="w-3 h-3" /> Voice Synthesizer
                  </div>
                  <div className="font-bold text-xs text-white">"Hello, thanks for calling AutoComm!"</div>
                  <div className="text-[10px] text-slate-400">Wait for customer response audio</div>
                </div>

                <div className="h-6 w-0.5 bg-slate-700" />

                {/* Node 3: AI Intent Decision */}
                <div className="w-72 p-3.5 rounded-xl bg-slate-900 border border-amber-500/60 shadow-lg text-center space-y-1">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" /> AI Intent Classification
                  </div>
                  <div className="font-bold text-xs text-white">Detect Customer Intent & Sentiment</div>
                </div>

                <div className="h-6 w-0.5 bg-amber-500/50" />

                {/* Branch Nodes (Yes / No) */}
                <div className="flex items-center gap-8">
                  <div className="w-56 p-3 rounded-xl bg-emerald-950/40 border border-emerald-600/50 shadow-md text-center space-y-1">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase">Intent: Demo / Interested</span>
                    <div className="font-bold text-xs text-white">Trigger CRM Lead & Book Demo</div>
                  </div>

                  <div className="w-56 p-3 rounded-xl bg-rose-950/40 border border-rose-600/50 shadow-md text-center space-y-1">
                    <span className="text-[9px] font-bold text-rose-400 uppercase">Intent: General Support</span>
                    <div className="font-bold text-xs text-white">Query Knowledge Base Grounding</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Select a conversation flow on the left to inspect or edit the graph
            </div>
          )}
        </div>
      </div>

      {/* Assign to Client Modal */}
      {isAssignModalOpen && selectedFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs text-white">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1">Assign Flow to Tenant</h2>
            <p className="text-slate-400 mb-4">
              Bind <strong>{selectedFlow.name}</strong> to a specific client company workspace.
            </p>

            <div className="space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Target Client Workspace</label>
                <select
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="global">-- Global System Template (All Tenants) --</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignFlow}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Flow Modal */}
      {isNewFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative text-xs text-white">
            <button
              onClick={() => setIsNewFlowModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold mb-1">Create Conversational Flow</h2>
            <p className="text-slate-400 mb-4">Initialize a new node tree for voice or messaging automation.</p>

            <form onSubmit={handleCreateFlow} className="space-y-4">
              <div>
                <label className="font-semibold block mb-1 text-slate-300">Flow Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appointment Confirmation & Reschedule"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFlowModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 rounded-lg font-medium text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Create Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
