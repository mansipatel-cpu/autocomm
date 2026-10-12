import React, { useState, useEffect } from 'react';
import {
  Phone,
  Plus,
  Headphones,
  Link2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  Radio,
  RefreshCw,
  Smartphone,
  Check,
  CreditCard,
  Video,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const PhoneNumbersPage = () => {
  const [numbers, setNumbers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Allocate Modal
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    phoneNumber: '+1 (555) 849-2041',
    friendlyName: 'Customer Inbound Support Line',
    country: 'US',
    type: 'Local',
    monthlyRate: 15.0,
  });
  const [submitting, setSubmitting] = useState(false);

  // Link Agent Modal
  const [linkModalNumber, setLinkModalNumber] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [numsRes, agentsRes] = await Promise.all([
        apiClient.get('/phone-numbers'),
        apiClient.get('/agents'),
      ]);
      setNumbers(numsRes.data.data || []);
      setAgents(agentsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load phone numbers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAllocateNumber = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/phone-numbers', allocateForm);
      setIsAllocateOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to allocate phone number');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAgentLink = async () => {
    if (!linkModalNumber) return;
    try {
      await apiClient.put(`/phone-numbers/${linkModalNumber._id}/assign-agent`, {
        agentId: selectedAgentId,
      });
      setLinkModalNumber(null);
      fetchData();
    } catch (err) {
      alert('Failed to update incoming connection');
    }
  };

  const handleRelease = async (numId) => {
    if (!confirm('Are you sure you want to release this phone number? Incoming calls will no longer connect.')) return;
    try {
      await apiClient.delete(`/phone-numbers/${numId}`);
      fetchData();
    } catch (err) {
      alert('Failed to release number');
    }
  };

  const pillButton = 'h-9 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-2xs';
  const releaseButton = 'w-full h-10 rounded-full bg-[#FF4D6A] hover:bg-[#F43F5E] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors';

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header Card (exact omnichannel-saas style) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#2F6BFF]">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-semibold text-slate-900 leading-tight">Phone Numbers</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage your dedicated phone numbers for inbound and outbound calls
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAllocateOpen(true)}
              className="h-9 px-4 rounded-xl bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-medium inline-flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Phone Number
            </button>
            <button
              type="button"
              onClick={() => fetchData()}
              className={pillButton}
            >
              <RefreshCw className="h-4 w-4 text-slate-400" />
              Refresh
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="h-4 w-4 text-slate-400" />
              <span className="text-lg font-semibold">{numbers.length}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Total Numbers</p>
          </div>

          <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-700">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-lg font-semibold">{numbers.length}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Active Numbers</p>
          </div>

          <div className="rounded-xl bg-white border border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-slate-700">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-semibold">50 Credits</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Monthly Credits</p>
          </div>
        </div>
      </div>

      {/* Grid of Dedicated Numbers */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : numbers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Phone className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No phone numbers allocated</h3>
          <p className="text-slate-500 mb-4 text-sm">
            Allocate a dedicated phone number to begin routing incoming calls to AgentLab AI agents.
          </p>
          <button
            onClick={() => setIsAllocateOpen(true)}
            className="h-10 px-5 rounded-xl bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-medium"
          >
            Allocate First Number
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {numbers.map((number) => (
            <div
              key={number._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-[17px] font-semibold text-slate-900 font-mono break-all">
                      {number.phoneNumber}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{number.friendlyName || 'Dedicated Inbound Line'}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-900 text-white">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Country:</span>
                    <span className="font-medium text-slate-900">{number.country || 'US'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Monthly Cost:</span>
                    <span className="font-medium text-slate-900">50 Credits</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Assigned Voice Agent:</span>
                    <span className="font-semibold text-blue-600">
                      {number.assignedAgentId?.name || 'Customer Concierge'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLinkModalNumber(number);
                    setSelectedAgentId(number.assignedAgentId?._id || (agents[0]?._id || ''));
                  }}
                  className="flex-1 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Route Agent
                </button>
                <button
                  type="button"
                  onClick={() => handleRelease(number._id)}
                  className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium inline-flex items-center justify-center transition-colors"
                  title="Release Number"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Allocate Number Modal */}
      {isAllocateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Allocate Phone Number</h3>
              <button onClick={() => setIsAllocateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAllocateNumber} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (E.164)</label>
                <input
                  type="tel"
                  required
                  value={allocateForm.phoneNumber}
                  onChange={(e) => setAllocateForm({ ...allocateForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Friendly Label</label>
                <input
                  type="text"
                  required
                  value={allocateForm.friendlyName}
                  onChange={(e) => setAllocateForm({ ...allocateForm, friendlyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-600 text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {submitting ? 'Allocating...' : 'Allocate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Agent Modal */}
      {linkModalNumber && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Route Number to AgentLab Agent</h3>
              <button onClick={() => setLinkModalNumber(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Direct incoming telephone calls to <strong>{linkModalNumber.phoneNumber}</strong> to an AI conversational agent.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select AI Voice Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                >
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name} ({ag.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLinkModalNumber(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAgentLink}
                  className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-600 text-white rounded-xl font-medium"
                >
                  Update Routing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
