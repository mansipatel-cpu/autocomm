import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sliders,
  Shield,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Send,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const AiSettingsTab = () => {
  const [settings, setSettings] = useState({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    systemPrompt: 'You are an intelligent customer support assistant for AutoComm. Be polite, concise, and helpful.',
    temperature: 0.7,
    tone: 'Friendly',
    escalationKeywords: ['human', 'agent', 'support', 'manager'],
    autoEscalate: true,
    qaPairs: [],
    isActive: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  // Q&A pair form
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  // Simulator
  const [simInput, setSimInput] = useState('');
  const [simMessages, setSimMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your configured AutoComm AI Assistant. Test questions, pricing or escalation triggers with me here!',
    },
  ]);
  const [testingAi, setTestingAi] = useState(false);

  const fetchAiSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/ai-settings');
      if (res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await apiClient.put('/ai-settings', settings);
      setSettings(res.data.data);
      alert('AI settings saved successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const kw = keywordInput.trim().toLowerCase();
    if (!settings.escalationKeywords.includes(kw)) {
      setSettings({
        ...settings,
        escalationKeywords: [...settings.escalationKeywords, kw],
      });
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove) => {
    setSettings({
      ...settings,
      escalationKeywords: settings.escalationKeywords.filter((k) => k !== kwToRemove),
    });
  };

  const handleAddQAPair = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const newPair = {
      id: `qa-${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };
    setSettings({
      ...settings,
      qaPairs: [...settings.qaPairs, newPair],
    });
    setNewQuestion('');
    setNewAnswer('');
  };

  const handleRemoveQAPair = (id) => {
    setSettings({
      ...settings,
      qaPairs: settings.qaPairs.filter((p) => p.id !== id),
    });
  };

  const handleRunSimulator = async (e) => {
    e.preventDefault();
    if (!simInput.trim() || testingAi) return;

    const userText = simInput.trim();
    setSimMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setSimInput('');
    setTestingAi(true);

    try {
      const res = await apiClient.post('/ai-settings/test', { message: userText });
      const data = res.data.data;
      setSimMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: data.reply,
          escalated: data.escalated,
          matchedRule: data.matchedRule,
        },
      ]);
    } catch (err) {
      setSimMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Error simulating response from AI assistant.' },
      ]);
    } finally {
      setTestingAi(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading AI settings...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: Configuration Form */}
      <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-6 text-xs">
        {/* Model & Provider Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Bot className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Model Provider & Credentials</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1 text-slate-700">AI Provider</label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5)</option>
                <option value="gemini">Google Vertex AI (Gemini)</option>
                <option value="groq">Groq (Llama 3.1 Fast)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1 text-slate-700">Model Name</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Recommended)</option>
                <option value="gpt-4o">gpt-4o (High Intelligence)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="claude-3-5-haiku">claude-3-5-haiku</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700">Custom Provider API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-proj-... (Leave blank to use platform pool credits)"
                value={settings.apiKey}
                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Behavior & Persona Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Behavior, Tone & Persona</h3>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700">System Persona Prompt</label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Define identity, company context, and how the bot should represent your brand..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1 text-slate-700">Tone of Voice</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['Friendly', 'Professional', 'Direct', 'Empathetic'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSettings({ ...settings, tone: t })}
                    className={`py-1.5 px-2 rounded-lg font-semibold border transition-all text-center ${
                      settings.tone === t
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Creativity (Temperature)</label>
                <span className="font-mono text-slate-600 font-bold">{settings.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full accent-blue-600 mt-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Exact / Focused</span>
                <span>Balanced</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        </div>

        {/* Human Escalation Rules */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Human Escalation Safeguards</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={settings.autoEscalate}
                onChange={(e) => setSettings({ ...settings, autoEscalate: e.target.checked })}
                className="w-4 h-4 rounded-sm text-blue-600 accent-blue-600"
              />
              Auto-Transfer to Agent
            </label>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-slate-700">Trigger Keywords</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add keyword (e.g., manager, speak to person)..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {settings.escalationKeywords.map((kw) => (
                <span
                  key={kw}
                  className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 border border-slate-200"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Q&A Pairs Builder */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Instant Q&A Overrides</h3>
          </div>

          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <input
              type="text"
              placeholder="Common user question (e.g. What is your refund policy?)"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
            <textarea
              rows={2}
              placeholder="Exact official answer..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddQAPair}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Q&A Pair
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {settings.qaPairs.map((pair) => (
              <div
                key={pair.id}
                className="p-3 border border-slate-200 rounded-lg bg-white flex items-start justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-slate-900 mb-0.5">Q: {pair.question}</div>
                  <div className="text-slate-600 text-[11px]">A: {pair.answer}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveQAPair(pair.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0066FF] hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save AI Settings'}
          </button>
        </div>
      </form>

      {/* Right 5 Cols: Live Interactive AI Simulator */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col h-[750px] overflow-hidden text-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-bold text-slate-900">Live AI Assistant Simulator</div>
              <div className="text-[10px] text-slate-500">Test prompt, tone & knowledge matches</div>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Ready
          </span>
        </div>

        {/* Simulator Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
          {simMessages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                {m.escalated && (
                  <div className="text-[10px] font-bold text-amber-600 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Escalation Flagged
                  </div>
                )}
                {m.matchedRule && (
                  <div className="text-[9px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                    {m.matchedRule}
                  </div>
                )}
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {testingAi && (
            <div className="text-slate-400 text-xs italic pl-2">AI is thinking...</div>
          )}
        </div>

        {/* Simulator Input */}
        <form onSubmit={handleRunSimulator} className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            placeholder="Type a test inquiry (e.g. Can I speak to an agent?)..."
            value={simInput}
            onChange={(e) => setSimInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!simInput.trim() || testingAi}
            className="px-3.5 py-2 bg-[#0066FF] hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
