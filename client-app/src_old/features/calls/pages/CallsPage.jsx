import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneOff,
  Play,
  Pause,
  Clock,
  Calendar,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Mic,
  FileText,
  PhoneCall,
  RefreshCw,
  Eye,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const CallsPage = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'transcribed', 'recordings'

  // Audio Playback simulation
  const [playingCallId, setPlayingCallId] = useState(null);
  const [audioProgress, setAudioProgress] = useState(0);

  // Test Call Trigger Modal
  const [isTestCallOpen, setIsTestCallOpen] = useState(false);
  const [testForm, setTestForm] = useState({
    contactPhoneNumber: '+1 (555) 392-8172',
    contactName: 'Alex Mercer',
  });
  const [triggering, setTriggering] = useState(false);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/calls');
      setCalls(res.data.data || []);
    } catch (err) {
      console.error('Failed to load call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleTriggerTestCall = async (e) => {
    e.preventDefault();
    setTriggering(true);
    try {
      const res = await apiClient.post('/calls/test-call', testForm);
      setIsTestCallOpen(false);
      fetchCalls();
      setSelectedCall(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger test call');
    } finally {
      setTriggering(false);
    }
  };

  const handleTogglePlay = (callId) => {
    if (playingCallId === callId) {
      setPlayingCallId(null);
      setAudioProgress(0);
    } else {
      setPlayingCallId(callId);
      setAudioProgress(15);
      const timer = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setPlayingCallId(null);
            return 0;
          }
          return prev + 20;
        });
      }, 1000);
    }
  };

  const formatSeconds = (sec = 0) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const filteredCalls = calls.filter((c) => {
    if (directionFilter !== 'all' && c.direction !== directionFilter) return false;
    if (statusFilter !== 'all' && c.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (activeTab === 'transcribed' && !c.transcript) return false;
    if (activeTab === 'recordings' && !c.recordingUrl) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.contactName?.toLowerCase().includes(q);
      const matchPhone = c.contactPhoneNumber?.toLowerCase().includes(q);
      const matchId = c.callId?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }
    return true;
  });

  const totalCalls = calls.length;
  const completedCalls = calls.filter((c) => c.status === 'Completed').length;
  const incomingCalls = calls.filter((c) => c.direction === 'inbound').length;
  const outgoingCalls = calls.filter((c) => c.direction === 'outbound').length;

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <a href="/dashboard" className="hover:text-slate-600 transition-colors">Home</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Calls</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCalls()}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Sync Logs
          </button>
          <button
            onClick={() => setIsTestCallOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            Trigger Test Voice Call
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Calls</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">{totalCalls}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">+15.2% this month</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed Calls</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">{completedCalls}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">94.8% completion rate</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Incoming Calls</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">{incomingCalls}</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Auto-IVR routed</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PhoneIncoming className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Outgoing Calls</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">{outgoingCalls}</p>
              <p className="text-xs text-violet-500 mt-2 font-medium">Campaign dispatches</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <PhoneOutgoing className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row (All Calls, Transcribed, Recordings) */}
      <div className="border-b border-slate-200 pb-3">
        <div className="inline-flex rounded-xl bg-[#F4F6F8] p-1">
          {[
            { id: 'all', label: 'All Calls', count: totalCalls },
            { id: 'transcribed', label: 'Transcribed', count: calls.filter((c) => c.transcript).length },
            { id: 'recordings', label: 'Recordings', count: calls.filter((c) => c.recordingUrl).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#007BFF] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              <span
                className={`min-w-5 h-5 px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                  activeTab === tab.id ? 'bg-blue-50 text-[#007BFF]' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#007BFF]"
          >
            <option value="all">Direction: All</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#007BFF]"
          >
            <option value="all">Status: All</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed / Busy</option>
            <option value="in-progress">In-Progress</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contact, phone or Call ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-[#007BFF]"
          />
        </div>
      </div>

      {/* Calls Cards List (Exact omnichannel-saas card design) */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading call records...</div>
      ) : filteredCalls.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Phone className="h-12 w-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-900 mb-1">No call records found</h3>
          <p className="text-xs text-slate-500 mb-4">Click "Trigger Test Voice Call" above to simulate an AI voice conversation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCalls.map((call) => {
            const isCompleted = call.status === 'Completed';
            const isMissed = call.status === 'Failed' || call.status === 'Busy';
            const accent = isCompleted
              ? 'bg-emerald-500'
              : isMissed
              ? 'bg-rose-500'
              : 'bg-amber-400';

            return (
              <div
                key={call._id || call.callId}
                className="relative flex items-center gap-4 bg-white border border-slate-200 rounded-2xl pl-5 pr-4 py-4 shadow-2xs hover:shadow-md transition-shadow"
              >
                <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${accent}`} />

                {/* Circular Icon */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    isMissed
                      ? 'bg-rose-50 text-rose-500'
                      : call.direction === 'inbound'
                      ? 'bg-emerald-50 text-emerald-500'
                      : 'bg-sky-50 text-sky-500'
                  }`}
                >
                  {isMissed ? (
                    <PhoneOff className="h-4 w-4" />
                  ) : call.direction === 'inbound' ? (
                    <PhoneIncoming className="h-4 w-4" />
                  ) : (
                    <Phone className="h-4 w-4" />
                  )}
                </div>

                {/* Body Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-slate-900 truncate">
                      {call.contactName || call.contactPhoneNumber}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
                      {call.contactPhoneNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : isMissed
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {call.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#007BFF] text-[10px] font-medium">
                      AgentLab Engine
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formatSeconds(call.durationSeconds || 120)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(call.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                      <Mic className="h-3 w-3" />
                      Recording
                    </span>
                    {call.transcript && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                        <FileText className="h-3 w-3" />
                        Transcript
                      </span>
                    )}
                    {call.sentiment && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
                        Sentiment: {call.sentiment}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  <button
                    type="button"
                    onClick={() => handleTogglePlay(call._id || call.callId)}
                    className="h-10 w-10 rounded-full border border-slate-200 bg-white text-slate-700 inline-flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    {playingCallId === (call._id || call.callId) ? (
                      <Pause className="h-4 w-4 text-[#007BFF]" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCall(call)}
                    className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="h-4 w-4 text-slate-500" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Transcript Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Call Inspection: {selectedCall.contactName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedCall.contactPhoneNumber}</p>
              </div>
              <button onClick={() => setSelectedCall(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400">Duration</span>
                  <div className="font-bold text-slate-900 mt-0.5">{formatSeconds(selectedCall.durationSeconds || 120)}</div>
                </div>
                <div>
                  <span className="text-slate-400">Direction</span>
                  <div className="font-bold text-slate-900 mt-0.5 capitalize">{selectedCall.direction}</div>
                </div>
                <div>
                  <span className="text-slate-400">Status</span>
                  <div className="font-bold text-emerald-600 mt-0.5">{selectedCall.status}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Full AI Conversation Transcript</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap font-mono text-[11px] max-h-60 overflow-y-auto">
                  {selectedCall.transcript ||
                    `Agent: Hello Alex, this is AutoComm following up on your recent inquiry.\nUser: Hi there, I wanted to check if you support automatic SMS and WhatsApp triggers.\nAgent: Yes, absolutely! AutoComm supports omnichannel dispatches including WhatsApp templates and automated voice calls.`}
                </div>
              </div>

              <div className="pt-2 flex justify-end border-t border-slate-100">
                <button
                  onClick={() => setSelectedCall(null)}
                  className="px-4 py-2 bg-[#007BFF] text-white text-xs font-medium rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Test Call Modal */}
      {isTestCallOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Trigger Test Voice Call</h3>
              </div>
              <button onClick={() => setIsTestCallOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTriggerTestCall} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  value={testForm.contactName}
                  onChange={(e) => setTestForm({ ...testForm, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number to Call</label>
                <input
                  type="tel"
                  required
                  value={testForm.contactPhoneNumber}
                  onChange={(e) => setTestForm({ ...testForm, contactPhoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900 text-xs">
                AutoComm will simulate an inbound voice call connection with full speech synthesis and transcription logging.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestCallOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={triggering}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {triggering ? 'Dialing...' : 'Place Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
