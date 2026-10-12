import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  MessageSquare,
  Clock,
  CheckCheck,
  Check,
  AlertTriangle,
  UserCheck,
  Filter,
  MoreVertical,
  ShieldAlert,
  ChevronRight,
  FileText,
  X,
  Phone,
  RefreshCw,
  MessageCircle,
  Paperclip,
  Smile,
  ShieldCheck,
  User,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export const TeamInboxPage = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'wa', 'widget'
  const [searchQuery, setSearchQuery] = useState('');

  // Input & Template Modal
  const [inputText, setInputText] = useState('');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (preserveSelected = true) => {
    try {
      const res = await apiClient.get('/inbox/conversations');
      const list = res.data.data || [];
      setConversations(list);

      if (list.length > 0) {
        if (!preserveSelected || !selectedConv) {
          setSelectedConv(list[0]);
        } else {
          const updated = list.find((c) => c._id === selectedConv._id);
          if (updated) setSelectedConv(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!convId) return;
    setMessagesLoading(true);
    try {
      const res = await apiClient.get(`/inbox/conversations/${convId}/messages`);
      setMessages(res.data.data || []);
      // Mark as read
      await apiClient.put(`/inbox/conversations/${convId}/read`);
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await apiClient.get('/templates', { params: { type: 'whatsapp' } });
      setTemplates(res.data.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  useEffect(() => {
    fetchConversations(false);
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv._id);
    }
  }, [selectedConv?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isWindowExpired = Boolean(
    selectedConv &&
      selectedConv.source === 'WA' &&
      (!selectedConv.lastInboundAt ||
        Date.now() - new Date(selectedConv.lastInboundAt).getTime() > TWENTY_FOUR_HOURS_MS)
  );

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedConv || isWindowExpired) return;

    setSendingMessage(true);
    try {
      const res = await apiClient.post(`/inbox/conversations/${selectedConv._id}/messages`, {
        text: inputText.trim(),
      });
      setInputText('');
      setMessages((prev) => [...prev, res.data.data.message]);
      fetchConversations(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedTemplate || !selectedConv) return;
    setSendingMessage(true);
    try {
      const res = await apiClient.post(`/inbox/conversations/${selectedConv._id}/messages`, {
        templateId: selectedTemplate._id,
      });
      setIsTemplateModalOpen(false);
      setSelectedTemplate(null);
      setMessages((prev) => [...prev, res.data.data.message]);
      fetchConversations(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send template message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === 'unread' && conv.unreadCount === 0) return false;
    if (activeTab === 'wa' && conv.source !== 'WA') return false;
    if (activeTab === 'widget' && conv.source !== 'Widget') return false;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = conv.contactName?.toLowerCase().includes(query);
      const matchPhone = conv.contactPhoneNumber?.toLowerCase().includes(query);
      const matchText = conv.lastMessageText?.toLowerCase().includes(query);
      if (!matchName && !matchPhone && !matchText) return false;
    }

    return true;
  });

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Team Inbox</h1>
            <p className="text-xs text-slate-500">
              Live WhatsApp & Web Widget omnichannel customer communication
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchConversations(true)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main 2-Pane Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Conversations List */}
        <div className="w-80 md:w-96 border-r border-slate-200 flex flex-col bg-slate-50/40">
          {/* Search & Tabs */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-[#007BFF]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto text-xs pb-0.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'wa', label: 'WhatsApp' },
                { id: 'widget', label: 'Widget' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-[#007BFF] font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No conversations found</div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedConv?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3.5 cursor-pointer transition-colors relative flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-[#007BFF]'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {conv.contactName?.[0] || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-slate-900 text-xs truncate">
                          {conv.contactName || conv.contactPhoneNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessageText || 'New incoming message...'}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            conv.source === 'WA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {conv.source || 'WA'}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-[#007BFF] text-white text-[9px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Pane */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col bg-slate-50/30">
            {/* Chat Header */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                  {selectedConv.contactName?.[0] || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedConv.contactName || selectedConv.contactPhoneNumber}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                      WhatsApp Verified
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {selectedConv.contactPhoneNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Send WhatsApp Template
                </button>
              </div>
            </div>

            {/* 24-hour Meta service window warning if expired */}
            {isWindowExpired && (
              <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>
                    Meta 24-hour service window closed. Free-form text disabled. Send an approved template to reopen window.
                  </span>
                </div>
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="font-semibold text-amber-800 underline hover:text-amber-900"
                >
                  Choose Template
                </button>
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {messagesLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading chat history...</div>
              ) : messages.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No messages yet. Send a message to start conversation.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound';
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs whitespace-pre-wrap ${
                          isOutbound
                            ? 'bg-[#007BFF] text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isOutbound && <CheckCheck className="w-3 h-3 text-blue-500" />}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    isWindowExpired
                      ? 'Service window closed. Send template above...'
                      : 'Type reply message...'
                  }
                  disabled={isWindowExpired || sendingMessage}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-[#007BFF] focus:bg-white disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isWindowExpired || !inputText.trim() || sendingMessage}
                  className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* WhatsApp Template Picker Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Select WhatsApp Template</h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {templates.length === 0 ? (
                <div className="p-8 text-center text-slate-400">No approved WhatsApp templates found.</div>
              ) : (
                templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplate?._id === tpl._id
                        ? 'border-[#007BFF] bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{tpl.name}</div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{tpl.bodyText}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                      {tpl.category}
                    </span>
                  </div>
                ))
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedTemplate || sendingMessage}
                  onClick={handleSendTemplate}
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium disabled:opacity-50"
                >
                  Send Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
