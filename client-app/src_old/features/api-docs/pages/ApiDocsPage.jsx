import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  Code2,
  Terminal,
  X,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const ApiDocsPage = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedText, setCopiedText] = useState(null);
  const [isNewKeyModalOpen, setIsNewKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState(null);
  const [activeCodeLang, setActiveCodeLang] = useState('curl'); // 'curl', 'node', 'python'

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api-keys');
      setApiKeys(res.data.data || []);
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/api-keys', { name: keyName });
      setNewlyGeneratedKey(res.data.data.plainApiKey);
      setKeyName('');
      fetchKeys();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? Existing integrations will stop working.')) return;
    try {
      await apiClient.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      alert('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.autocomm.io/v1/whatsapp/messages \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+15553928172",
    "template": "seasonal_promo_discount_q3",
    "parameters": { "1": "Sarah", "2": "SAVE30" }
  }'`,
    node: `import axios from 'axios';

const response = await axios.post(
  'https://api.autocomm.io/v1/whatsapp/messages',
  {
    to: '+15553928172',
    template: 'seasonal_promo_discount_q3',
    parameters: { '1': 'Sarah', '2': 'SAVE30' },
  },
  {
    headers: { Authorization: 'Bearer YOUR_API_KEY' },
  }
);`,
    python: `import requests

res = requests.post(
    "https://api.autocomm.io/v1/whatsapp/messages",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={
        "to": "+15553928172",
        "template": "seasonal_promo_discount_q3",
        "parameters": {"1": "Sarah", "2": "SAVE30"},
    },
)`,
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-[#2F6BFF] flex items-center justify-center shadow-sm shrink-0">
              <Key className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">API Documentation & Developer Keys</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Integrate AutoComm programmatic WhatsApp messaging and AgentLab voice calling into your external systems
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setNewlyGeneratedKey(null);
              setIsNewKeyModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-[#2F6BFF] hover:bg-blue-600 text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Generate Secret API Key
          </button>
        </div>
      </div>

      {/* API Keys Table Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active API Keys</h2>
            <p className="text-xs text-slate-500 mt-0.5">Header: <code>Authorization: Bearer &lt;SECRET_KEY&gt;</code></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Key Label</th>
                <th className="py-3 px-4">Secret Token Preview</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Loading keys...</td>
                </tr>
              ) : apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No API keys created. Generate one above to begin external REST API integrations.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => (
                  <tr key={key._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{key.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <code>{key.prefix || 'ac_live_...'}••••••••••••••••</code>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium text-[11px]">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRevokeKey(key._id)}
                        className="text-rose-500 hover:text-rose-700 font-medium text-xs"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets & Documentation Card */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-[#2F6BFF]" />
            <h3 className="font-bold text-sm text-slate-900">Developer Integration Snippets</h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            {['curl', 'node', 'python'].map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveCodeLang(lang)}
                className={`px-3 py-1 rounded-md font-medium uppercase transition-colors ${
                  activeCodeLang === lang
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="relative rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto shadow-inner">
          <button
            onClick={() => copyToClipboard(codeSnippets[activeCodeLang], 'snippet')}
            className="absolute right-3 top-3 h-7 px-2.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] inline-flex items-center gap-1 transition-colors"
          >
            {copiedText === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copiedText === 'snippet' ? 'Copied' : 'Copy'}
          </button>
          <pre>{codeSnippets[activeCodeLang]}</pre>
        </div>
      </div>

      {/* Generate Key Modal */}
      {isNewKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">Generate Secret API Key</h3>
              <button onClick={() => setIsNewKeyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {newlyGeneratedKey ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  Save this key now! It will not be shown again for security reasons.
                </div>
                <div className="relative p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs break-all">
                  {newlyGeneratedKey}
                  <button
                    onClick={() => copyToClipboard(newlyGeneratedKey, 'new-key')}
                    className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 font-sans font-medium"
                  >
                    {copiedText === 'new-key' ? 'Copied to clipboard' : 'Copy Secret Key'}
                  </button>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsNewKeyModalOpen(false)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Key Name / Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Backend Webhook"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2F6BFF] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewKeyModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#2F6BFF] hover:bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
