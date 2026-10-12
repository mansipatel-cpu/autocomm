import React, { useState, useEffect } from 'react';
import {
  Globe,
  FileText,
  UploadCloud,
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  HardDrive,
  Cpu,
  BookOpen,
  Brain,
  Type,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

export const KnowledgeBasePage = () => {
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({
    totalSources: 6,
    indexedCount: 6,
    totalStorageUsed: 1258291,
    storageLimit: 20971520, // 20 MB
    storagePercent: 6,
    totalCharacters: 124500,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'url', 'text', 'file'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);

  // Forms
  const [urlForm, setUrlForm] = useState({ title: '', url: '' });
  const [textForm, setTextForm] = useState({ title: '', content: '' });
  const [fileForm, setFileForm] = useState({ title: '', fileName: '', fileSize: 0, fileType: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/knowledge-base');
      setSources(res.data.data?.sources || []);
      if (res.data.data?.stats) {
        setStats(res.data.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch knowledge sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleAddUrl = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/knowledge-base/url', urlForm);
      setUrlForm({ title: '', url: '' });
      setIsUrlModalOpen(false);
      fetchSources();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to index URL');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddText = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/knowledge-base/text', textForm);
      setTextForm({ title: '', content: '' });
      setIsTextModalOpen(false);
      fetchSources();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save text document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/knowledge-base/file', fileForm);
      setFileForm({ title: '', fileName: '', fileSize: 0, fileType: '' });
      setIsFileModalOpen(false);
      fetchSources();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSource = async (id) => {
    if (!confirm('Are you sure you want to remove this knowledge document?')) return;
    try {
      await apiClient.delete(`/knowledge-base/${id}`);
      fetchSources();
    } catch (err) {
      alert('Failed to delete source');
    }
  };

  const formatBytes = (bytes = 0) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const urlCount = sources.filter((item) => item.type === 'url').length;
  const fileCount = sources.filter((item) => item.type === 'file').length;
  const textCount = sources.filter((item) => item.type === 'text').length;
  const totalChunks = Math.max(12, sources.length * 6);

  const filteredSources = sources.filter((src) => {
    if (activeTab !== 'all' && src.type !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = src.title?.toLowerCase().includes(q);
      const matchUrl = src.url?.toLowerCase().includes(q);
      const matchFile = src.fileName?.toLowerCase().includes(q);
      if (!matchTitle && !matchUrl && !matchFile) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Top Header Card (exact omnichannel-saas style) */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-5 py-5 md:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-[#2563EB]">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-[22px] font-bold text-slate-900 tracking-tight">
                Knowledge Base
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Upload documents, add web pages, or enter text to train your AI agents
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <Globe className="h-4 w-4" />
              Add URL
            </button>
            <button
              onClick={() => setIsFileModalOpen(true)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
            >
              <FileText className="h-4 w-4" />
              Add Files
            </button>
            <button
              onClick={() => setIsTextModalOpen(true)}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Type className="h-4 w-4" />
              Create Text
            </button>
          </div>
        </div>
      </div>

      {/* 5 Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-4">
          <div className="text-[28px] font-bold leading-none tabular-nums text-[#2563EB]">
            {sources.length}
          </div>
          <div className="mt-1.5 text-sm text-slate-500">Total Items</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="text-[28px] font-bold leading-none tabular-nums text-[#2563EB]">
              {totalChunks}
            </div>
            <Brain className="h-4 w-4 text-[#2563EB]" />
          </div>
          <div className="mt-1.5 text-sm text-slate-500">Knowledge Chunks</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="text-[28px] font-bold leading-none tabular-nums text-[#16A34A]">
              {urlCount + fileCount}
            </div>
            <FileText className="h-4 w-4 text-[#16A34A]" />
          </div>
          <div className="mt-1.5 text-sm text-slate-500">Docs & URLs</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="text-[28px] font-bold leading-none tabular-nums text-[#F97316]">
              {textCount}
            </div>
            <Type className="h-4 w-4 text-[#F97316]" />
          </div>
          <div className="mt-1.5 text-sm text-slate-500">Text Entries</div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold tabular-nums text-[#2563EB]">
              {formatBytes(stats.totalStorageUsed || 1258291)}
            </span>
            <span className="text-sm text-slate-400">/ {formatBytes(stats.storageLimit || 20971520)}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${stats.storagePercent || 6}%` }} />
          </div>
          <div className="mt-1.5 text-sm text-slate-500">Storage Used</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl text-xs w-fit">
            {[
              { id: 'all', label: 'All' },
              { id: 'url', label: 'URLs' },
              { id: 'file', label: 'Files' },
              { id: 'text', label: 'Text' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search knowledge items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Table of Knowledge Items */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-sky-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Document / Source</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading documents...</td>
                </tr>
              ) : filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No knowledge items found.</td>
                </tr>
              ) : (
                filteredSources.map((src) => (
                  <tr key={src._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                          {src.type === 'url' ? <Globe className="w-4 h-4" /> : src.type === 'file' ? <FileText className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 text-xs truncate">{src.title}</div>
                          {src.url && (
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate"
                            >
                              <span>{src.url}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {src.fileName && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{src.fileName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {src.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {src.chunkCount || 8} chunks
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Indexed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(src.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSource(src._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* URL Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Add Web Page URL</h3>
              <button onClick={() => setIsUrlModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddUrl} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return Policy & FAQ"
                  value={urlForm.title}
                  onChange={(e) => setUrlForm({ ...urlForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2563EB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Web Page URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/faq"
                  value={urlForm.url}
                  onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2563EB] focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {submitting ? 'Indexing...' : 'Index URL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Text Modal */}
      {isTextModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Add Text Grounding</h3>
              <button onClick={() => setIsTextModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddText} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Discount Rules"
                  value={textForm.title}
                  onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2563EB] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Knowledge Content</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Paste your operational instructions or support policies..."
                  value={textForm.content}
                  onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2563EB] focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTextModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : 'Save Knowledge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Modal */}
      {isFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-900">Upload Knowledge File</h3>
              <button onClick={() => setIsFileModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddFile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Catalog 2026"
                  value={fileForm.title}
                  onChange={(e) => setFileForm({ ...fileForm, title: e.target.value, fileName: `${e.target.value}.pdf` })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#2563EB] focus:outline-none"
                />
              </div>
              <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center">
                <UploadCloud className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-xs text-slate-600 mb-2">Upload PDF, DOCX, or TXT file</p>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFileForm({
                        title: fileForm.title || file.name.replace(/\.[^/.]+$/, ''),
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type,
                      });
                    }
                  }}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-[#2563EB] cursor-pointer"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFileModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-60"
                >
                  {submitting ? 'Uploading...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
