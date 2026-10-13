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
  HelpCircle,
  Calendar,
  FileText,
  Globe,
  PhoneForwarded,
  Clock,
  Volume2,
  StopCircle,
  X,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Settings,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';

// 10 Section 21.7 Node Type Definitions
const NODE_TYPES = [
  { type: 'message', label: 'Message', icon: MessageSquare, color: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-500/10', desc: 'Synthesizer speech prompt or text' },
  { type: 'question', label: 'Question', icon: HelpCircle, color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-500/10', desc: 'Ask user and capture response' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', desc: 'If / Else decision branching' },
  { type: 'appointment', label: 'Appointment', icon: Calendar, color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', desc: 'Schedule calendar slot' },
  { type: 'form', label: 'Form', icon: FileText, color: 'text-indigo-400', border: 'border-indigo-500/40', bg: 'bg-indigo-500/10', desc: 'Multi-field data collection' },
  { type: 'webhook', label: 'Webhook', icon: Globe, color: 'text-teal-400', border: 'border-teal-500/40', bg: 'bg-teal-500/10', desc: 'External REST API integration' },
  { type: 'transfer', label: 'Transfer', icon: PhoneForwarded, color: 'text-rose-400', border: 'border-rose-500/40', bg: 'bg-rose-500/10', desc: 'Live agent or PSTN call handoff' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'text-orange-400', border: 'border-orange-500/40', bg: 'bg-orange-500/10', desc: 'Wait duration buffer' },
  { type: 'play_audio', label: 'Play Audio', icon: Volume2, color: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-500/10', desc: 'Stream media or audio recording' },
  { type: 'end', label: 'End', icon: StopCircle, color: 'text-red-400', border: 'border-red-500/40', bg: 'bg-red-500/10', desc: 'Terminate conversation or call' },
];

export const FlowBuilderPage = () => {
  const [flows, setFlows] = useState([]);
  const [clients, setClients] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Selected Node for editing
  const [activeEditingNode, setActiveEditingNode] = useState(null);

  // Modals state
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignModalError, setAssignModalError] = useState('');

  // New flow form
  const [newFlowForm, setNewFlowForm] = useState({
    name: '',
    description: '',
    voiceAgentName: '',
    status: 'ACTIVE',
  });

  // Assign flow form
  const [assignForm, setAssignForm] = useState({
    clientId: 'global',
    voiceAgentName: '',
    assignedPhoneNumber: '',
    status: 'ACTIVE',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: () => {},
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flowsRes, clientsRes, phonesRes] = await Promise.all([
        superAdminApiClient.get('/flows'),
        superAdminApiClient.get('/clients', { params: { limit: 100 } }),
        superAdminApiClient.get('/phone-numbers', { params: { limit: 100 } }).catch(() => ({ data: { data: { phoneNumbers: [] } } })),
      ]);
      const flowList = flowsRes.data.data || [];
      setFlows(flowList);
      setClients(clientsRes.data.data.clients || clientsRes.data.data || []);
      setPhoneNumbers(phonesRes.data.data.phoneNumbers || []);

      if (flowList.length > 0) {
        const current = selectedFlow ? flowList.find((f) => f._id === selectedFlow._id) || flowList[0] : flowList[0];
        setSelectedFlow(current);
        setNodes(current.nodes || []);
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

  const handleSelectFlow = (flow) => {
    setSelectedFlow(flow);
    setNodes(flow.nodes || []);
    setActiveEditingNode(null);
  };

  // Node operations
  const handleAddNode = (typeObj) => {
    const newNodeId = `node_${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: typeObj.type,
      label: `${typeObj.label} Step`,
      prompt: typeObj.type === 'message' ? 'Hello from AutoComm!' : undefined,
      question: typeObj.type === 'question' ? 'Please provide your account ID?' : undefined,
      condition: typeObj.type === 'condition' ? 'input == "confirm"' : undefined,
      targetNumber: typeObj.type === 'transfer' ? '+18005550199' : undefined,
      audioUrl: typeObj.type === 'play_audio' ? 'https://cdn.autocomm.io/audio/welcome.mp3' : undefined,
      position: { x: 100, y: (nodes.length + 1) * 120 },
    };
    const updated = [...nodes, newNode];
    setNodes(updated);
    setActiveEditingNode(newNode);
  };

  const handleUpdateNode = (updatedNode) => {
    const updated = nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
    setNodes(updated);
    setActiveEditingNode(updatedNode);
  };

  const handleDeleteNode = (nodeId) => {
    const updated = nodes.filter((n) => n.id !== nodeId);
    setNodes(updated);
    if (activeEditingNode?.id === nodeId) {
      setActiveEditingNode(null);
    }
  };

  const handleSaveFlowCanvas = async () => {
    if (!selectedFlow) return;
    setSaving(true);
    try {
      await superAdminApiClient.put(`/flows/${selectedFlow._id}`, {
        nodes,
      });
      setActionMessage('Flow canvas structure saved successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to save flow canvas');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminApiClient.post('/flows', {
        name: newFlowForm.name,
        description: newFlowForm.description,
        voiceAgentName: newFlowForm.voiceAgentName,
        status: newFlowForm.status,
      });
      setIsNewFlowModalOpen(false);
      setNewFlowForm({ name: '', description: '', voiceAgentName: '', status: 'ACTIVE' });
      fetchData();
      handleSelectFlow(res.data.data);
      setActionMessage(`Flow "${res.data.data.name}" created successfully.`);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to create flow');
    }
  };

  const handleToggleFlowStatus = async (flow) => {
    try {
      const newStatus = flow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await superAdminApiClient.put(`/flows/${flow._id}`, {
        status: newStatus,
        isPublished: newStatus === 'ACTIVE',
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to toggle flow status');
    }
  };

  const handleOpenAssignModal = () => {
    if (!selectedFlow) return;
    setAssignModalError('');
    setAssignForm({
      clientId: selectedFlow.assignedClientId || 'global',
      voiceAgentName: selectedFlow.voiceAgentName || '',
      assignedPhoneNumber: selectedFlow.assignedPhoneNumber || '',
      status: selectedFlow.status || 'ACTIVE',
      effectiveDate: selectedFlow.effectiveDate
        ? new Date(selectedFlow.effectiveDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
    setIsAssignModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!selectedFlow) return;
    setAssignModalError('');
    try {
      const res = await superAdminApiClient.put(`/flows/${selectedFlow._id}/assign`, assignForm);
      setIsAssignModalOpen(false);
      setActionMessage('Flow assignment updated successfully.');
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to assign flow';
      setAssignModalError(errMsg);
    }
  };

  const handleDeleteFlow = (flow) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Visual Flow Graph',
      message: `Permanently delete conversational flow "${flow.name}"? Deployed bots using this decision tree will halt.`,
      confirmText: 'Delete Flow',
      isDanger: true,
      onConfirm: async () => {
        try {
          await superAdminApiClient.delete(`/flows/${flow._id}`);
          setSelectedFlow(null);
          setActionMessage(`Flow "${flow.name}" deleted.`);
          fetchData();
        } catch (err) {
          alert('Failed to delete flow');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Visual Flow Builder</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            10-node conversational canvas, multi-turn decision trees, and tenant assignment engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedFlow && (
            <button
              onClick={handleSaveFlowCanvas}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Flow Canvas'}
            </button>
          )}
          <button
            onClick={() => setIsNewFlowModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            Create Flow
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[760px]">
        {/* Left 4 Cols: Flows Listing */}
        <div className="lg:col-span-4 bg-[#0a0f1d] border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Flow Templates & Deployments
            </span>
            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
              {flows.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading flow graphs...</div>
            ) : flows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No flows created yet.</div>
            ) : (
              flows.map((flow) => {
                const isSelected = selectedFlow?._id === flow._id;
                const rootNodeId = flow.nodes?.[0]?.id || 'n-1';
                return (
                  <div
                    key={flow._id}
                    onClick={() => handleSelectFlow(flow)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border border-indigo-500/50'
                        : 'hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-xs text-white truncate max-w-[180px]">{flow.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFlowStatus(flow);
                          }}
                          className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase cursor-pointer border ${
                            flow.status === 'ACTIVE'
                              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/50'
                              : 'text-slate-400 bg-slate-800 border-slate-700'
                          }`}
                        >
                          {flow.status || 'ACTIVE'}
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                      {flow.description || 'Conversational tree'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-500">
                      <span>Node ID: <code className="text-slate-300 font-mono">{rootNodeId}</code></span>
                      <span>Updated: {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString() : '—'}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flow);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors"
                        title="Delete Flow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 8 Cols: Interactive Visual Canvas & 10-Node Palette */}
        <div className="lg:col-span-8 bg-[#070b14] border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative">
          {selectedFlow ? (
            <>
              {/* Canvas Header */}
              <div className="p-4 border-b border-slate-800 bg-[#0a0f1d] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{selectedFlow.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {nodes.length} Nodes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tenant: <strong className="text-indigo-300">{selectedFlow.assignedClientName}</strong>
                    {selectedFlow.voiceAgentName && ` • Agent: ${selectedFlow.voiceAgentName}`}
                    {selectedFlow.assignedPhoneNumber && ` • DID: ${selectedFlow.assignedPhoneNumber}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAssignModal}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Assign to Client Tenant
                  </button>
                </div>
              </div>

              {/* 10-Node Type Palette Toolbar */}
              <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs select-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0">
                  + Add Node:
                </span>
                {NODE_TYPES.map((nt) => {
                  const Icon = nt.icon;
                  return (
                    <button
                      key={nt.type}
                      onClick={() => handleAddNode(nt)}
                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 hover:scale-105 transition-all cursor-pointer ${nt.bg} ${nt.border} ${nt.color}`}
                      title={nt.desc}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="font-semibold text-[11px] text-white">{nt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Node Graph Visual Canvas */}
              <div className="flex-1 p-6 overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center space-y-4">
                {nodes.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 text-xs">
                    No nodes in this flow yet. Use the toolbar above to add your first node.
                  </div>
                ) : (
                  nodes.map((node, index) => {
                    const matchedType = NODE_TYPES.find((t) => t.type === node.type) || NODE_TYPES[0];
                    const Icon = matchedType.icon;
                    const isEditing = activeEditingNode?.id === node.id;

                    return (
                      <React.Fragment key={node.id}>
                        <div
                          onClick={() => setActiveEditingNode(node)}
                          className={`w-80 p-3.5 rounded-xl border shadow-xl cursor-pointer transition-all ${
                            isEditing
                              ? 'ring-2 ring-indigo-500 bg-slate-900 border-indigo-400'
                              : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${matchedType.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {matchedType.label}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-500">#{index + 1}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNode(node.id);
                                }}
                                className="text-slate-500 hover:text-rose-400 p-1"
                                title="Delete node"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="font-bold text-xs text-white mb-1">{node.label}</div>

                          {/* Node Type Specific Previews */}
                          {node.prompt && (
                            <p className="text-[11px] text-slate-300 italic line-clamp-2">"{node.prompt}"</p>
                          )}
                          {node.question && (
                            <p className="text-[11px] text-amber-300 line-clamp-2">Q: {node.question}</p>
                          )}
                          {node.condition && (
                            <p className="text-[11px] text-purple-300 font-mono">IF {node.condition}</p>
                          )}
                          {node.targetNumber && (
                            <p className="text-[11px] text-rose-300 font-mono">Transfer To: {node.targetNumber}</p>
                          )}
                          {node.audioUrl && (
                            <p className="text-[11px] text-cyan-300 font-mono truncate">{node.audioUrl}</p>
                          )}
                        </div>

                        {index < nodes.length - 1 && (
                          <div className="flex flex-col items-center">
                            <div className="h-5 w-0.5 bg-indigo-500/60" />
                            <ArrowRight className="w-3 h-3 text-indigo-400 rotate-90 my-[-2px]" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Node Edit Drawer (Bottom Bar) */}
              {activeEditingNode && (
                <div className="p-4 bg-[#0a0f1d] border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-indigo-400" />
                      Configure Node: {activeEditingNode.label}
                    </span>
                    <button
                      onClick={() => setActiveEditingNode(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Step Label</label>
                      <input
                        type="text"
                        value={activeEditingNode.label || ''}
                        onChange={(e) =>
                          handleUpdateNode({ ...activeEditingNode, label: e.target.value })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-medium"
                      />
                    </div>

                    {activeEditingNode.type === 'message' && (
                      <div className="md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Message Prompt</label>
                        <input
                          type="text"
                          value={activeEditingNode.prompt || ''}
                          onChange={(e) =>
                            handleUpdateNode({ ...activeEditingNode, prompt: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    )}

                    {activeEditingNode.type === 'question' && (
                      <div className="md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Question Prompt</label>
                        <input
                          type="text"
                          value={activeEditingNode.question || ''}
                          onChange={(e) =>
                            handleUpdateNode({ ...activeEditingNode, question: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    )}

                    {activeEditingNode.type === 'condition' && (
                      <div className="md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Condition Expression</label>
                        <input
                          type="text"
                          placeholder="e.g. intent == 'booking'"
                          value={activeEditingNode.condition || ''}
                          onChange={(e) =>
                            handleUpdateNode({ ...activeEditingNode, condition: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    )}

                    {activeEditingNode.type === 'transfer' && (
                      <div className="md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Transfer Destination Number</label>
                        <input
                          type="text"
                          placeholder="+18005550199"
                          value={activeEditingNode.targetNumber || ''}
                          onChange={(e) =>
                            handleUpdateNode({ ...activeEditingNode, targetNumber: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    )}

                    {activeEditingNode.type === 'play_audio' && (
                      <div className="md:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">Media Audio URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={activeEditingNode.audioUrl || ''}
                          onChange={(e) =>
                            handleUpdateNode({ ...activeEditingNode, audioUrl: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-slate-500 text-xs">
              Select or create a flow to view and edit its visual canvas.
            </div>
          )}
        </div>
      </div>

      {/* Create New Flow Modal */}
      {isNewFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsNewFlowModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateFlow} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Create New Visual Flow</h3>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Flow Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automotive Lead Qualification"
                  value={newFlowForm.name}
                  onChange={(e) => setNewFlowForm({ ...newFlowForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what this conversational tree accomplishes..."
                  value={newFlowForm.description}
                  onChange={(e) => setNewFlowForm({ ...newFlowForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Voice Agent (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sales Concierge"
                    value={newFlowForm.voiceAgentName}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, voiceAgentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Initial Status</label>
                  <select
                    value={newFlowForm.status}
                    onChange={(e) => setNewFlowForm({ ...newFlowForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewFlowModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Create Flow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Flow to Client Modal */}
      {isAssignModalOpen && selectedFlow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveAssignment} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-1">Flow Assignment</h3>
              <p className="text-slate-400 mb-3">Binding: <strong>{selectedFlow.name}</strong></p>

              {assignModalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                  {assignModalError}
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Client Workspace *</label>
                <select
                  value={assignForm.clientId}
                  onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="global">Global System Template (Unassigned)</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Voice Agent</label>
                  <input
                    type="text"
                    placeholder="e.g. Receptionist Bot"
                    value={assignForm.voiceAgentName}
                    onChange={(e) => setAssignForm({ ...assignForm, voiceAgentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Assigned Phone Number</label>
                  <select
                    value={assignForm.assignedPhoneNumber}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedPhoneNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
                  >
                    <option value="">None / Any</option>
                    {phoneNumbers.map((p) => (
                      <option key={p._id} value={p.phoneNumber}>
                        {p.phoneNumber} ({p.friendlyName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Status</label>
                  <select
                    value={assignForm.status}
                    onChange={(e) => setAssignForm({ ...assignForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={assignForm.effectiveDate}
                    onChange={(e) => setAssignForm({ ...assignForm, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Save & Apply Assignment
                </button>
              </div>
            </form>
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
