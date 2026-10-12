import React, { useState, useEffect } from 'react';
import {
  Radio,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  PowerOff,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Shield,
  Activity,
  Bot,
  Sliders,
  User,
  Clock,
  Lock,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';
import { AiSettingsTab } from '../components/AiSettingsTab';

export const SettingsPage = () => {
  const [topTab, setTopTab] = useState('channel'); // 'channel' | 'account' | 'ai'
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  // Profile State
  const [profile, setProfile] = useState({
    firstName: 'Mansi',
    lastName: 'Patel',
    email: 'client@autocomm.io',
    timezone: 'Asia/Kolkata (IST)',
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });

  // Channel Modals
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [testModalChannel, setTestModalChannel] = useState(null);

  // Forms
  const [newChannelForm, setNewChannelForm] = useState({
    channelName: 'Capermint Technologies',
    phoneNumber: '+919081044426',
    metaAppId: '109283746592817',
    phoneNumberId: '102938475610293',
    wabaId: '827364519283746',
    accessToken: 'EAAG1234567890abcdef...',
    businessAccountId: 'Capermint Business Inc',
  });

  const [testForm, setTestForm] = useState({
    phoneNumber: '919310797700',
    message: 'Hello! This is a test message from AutoComm WABA.',
  });

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/channels');
      setChannels(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/channels', newChannelForm);
      setIsAddChannelOpen(false);
      fetchChannels();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to connect WhatsApp channel');
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post(`/channels/${testModalChannel._id}/test-message`, testForm);
      alert(`Test message successfully sent to ${testForm.phoneNumber}!`);
      setTestModalChannel(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send test message');
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <a href="/dashboard" className="hover:text-slate-600 transition-colors">Home</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Platform Settings</span>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-slate-200 pb-3">
        <div className="inline-flex rounded-xl bg-[#F4F6F8] p-1">
          <button
            type="button"
            onClick={() => setTopTab('channel')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              topTab === 'channel'
                ? 'bg-white text-[#007BFF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp Channel Settings
          </button>

          <button
            type="button"
            onClick={() => setTopTab('account')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              topTab === 'account'
                ? 'bg-white text-[#007BFF] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            Profile & Account
          </button>

          <button
            type="button"
            onClick={() => setTopTab('ai')}
            className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
              topTab === 'ai'
                ? 'bg-[#007BFF] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="h-4 w-4" />
            AI & Model Settings
          </button>
        </div>
      </div>

      {/* Channel Settings View */}
      {topTab === 'channel' && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Radio className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">WhatsApp Business API (WABA) Connection</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage your Meta Cloud API connection, registered phone numbers, and webhook triggers
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddChannelOpen(true)}
              className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add WhatsApp Channel
            </button>
          </div>

          {/* Channels list */}
          <div className="space-y-4">
            {channels.map((chan) => (
              <div
                key={chan._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm">
                      WA
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{chan.channelName}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                          Connected
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{chan.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTestModalChannel(chan)}
                      className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      Send Test Message
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400">Phone Number ID</span>
                    <div className="font-mono font-semibold text-slate-900 mt-0.5">{chan.phoneNumberId}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400">WABA Account ID</span>
                    <div className="font-mono font-semibold text-slate-900 mt-0.5">{chan.wabaId}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400">Meta App ID</span>
                    <div className="font-mono font-semibold text-slate-900 mt-0.5">{chan.metaAppId}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile & Account Settings View */}
      {topTab === 'account' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Profile & Workspace Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage your user profile and timezone preferences</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
              <select
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                <option value="America/New_York (EST)">America/New_York (EST)</option>
                <option value="Europe/London (GMT)">Europe/London (GMT)</option>
                <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Current Time in {profile.timezone}: {new Date().toLocaleTimeString()}</span>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
              <button
                type="button"
                onClick={() => alert('Profile settings saved!')}
                className="h-10 px-5 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white font-medium"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings View */}
      {topTab === 'ai' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <AiSettingsTab />
        </div>
      )}

      {/* Add Channel Modal */}
      {isAddChannelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add WhatsApp Channel (Meta API)</h3>
              <button onClick={() => setIsAddChannelOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Channel Label</label>
                <input
                  type="text"
                  required
                  value={newChannelForm.channelName}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, channelName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number (E.164)</label>
                <input
                  type="tel"
                  required
                  value={newChannelForm.phoneNumber}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    required
                    value={newChannelForm.phoneNumberId}
                    onChange={(e) => setNewChannelForm({ ...newChannelForm, phoneNumberId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WABA Account ID</label>
                  <input
                    type="text"
                    required
                    value={newChannelForm.wabaId}
                    onChange={(e) => setNewChannelForm({ ...newChannelForm, wabaId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddChannelOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium"
                >
                  Connect Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Message Modal */}
      {testModalChannel && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Send Test WhatsApp Message</h3>
              <button onClick={() => setTestModalChannel(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Phone Number (with country code)</label>
                <input
                  type="tel"
                  required
                  value={testForm.phoneNumber}
                  onChange={(e) => setTestForm({ ...testForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message Text</label>
                <textarea
                  rows={3}
                  required
                  value={testForm.message}
                  onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTestModalChannel(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Change Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert('Password updated successfully!');
                setIsPasswordModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.next}
                  onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
