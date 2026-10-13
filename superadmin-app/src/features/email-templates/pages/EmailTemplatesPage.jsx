import React, { useState, useEffect } from 'react';
import { Mail, Edit3, Send, Eye, CheckCircle2, X, Plus, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewRendered, setPreviewRendered] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testModalTemplate, setTestModalTemplate] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Create form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    slug: '',
    subject: '',
    bodyHtml: '',
    variables: '',
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await superAdminApiClient.get('/email-templates');
      setTemplates(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggleStatus = async (tpl) => {
    try {
      await superAdminApiClient.patch(`/email-templates/${tpl._id}/status`);
      setStatusMsg(`Template "${tpl.name}" status updated.`);
      fetchTemplates();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const varsArray = newTemplate.variables
        ? newTemplate.variables.split(',').map((v) => v.trim()).filter(Boolean)
        : [];

      await superAdminApiClient.post('/email-templates', {
        name: newTemplate.name,
        slug: newTemplate.slug || newTemplate.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        subject: newTemplate.subject,
        bodyHtml: newTemplate.bodyHtml,
        variables: varsArray,
      });

      setStatusMsg(`Email template "${newTemplate.name}" created successfully.`);
      setIsCreateModalOpen(false);
      setNewTemplate({ name: '', slug: '', subject: '', bodyHtml: '', variables: '' });
      fetchTemplates();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create template');
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      await superAdminApiClient.put(`/email-templates/${selectedTemplate._id}`, {
        subject: selectedTemplate.subject,
        bodyHtml: selectedTemplate.bodyHtml,
        isActive: selectedTemplate.isActive,
      });
      setStatusMsg(`Template "${selectedTemplate.name}" updated successfully.`);
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err) {
      alert('Failed to update template');
    }
  };

  const handleOpenPreview = async (tpl) => {
    setPreviewTemplate(tpl);
    try {
      const res = await superAdminApiClient.post(`/email-templates/${tpl._id}/preview`, {
        sampleData: {
          clientName: 'Acme Corporation',
          adminName: 'Sarah Connor',
          email: 'admin@acme.com',
          temporaryPassword: 'TempPass123!#',
          loginUrl: 'https://app.autocomm.io/login',
        },
      });
      setPreviewRendered(res.data.data);
    } catch (err) {
      // Fallback to raw template
      setPreviewRendered({ subject: tpl.subject, bodyHtml: tpl.bodyHtml });
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    try {
      await superAdminApiClient.post(`/email-templates/${testModalTemplate._id}/test`, {
        email: testEmailAddress,
      });
      alert(`Test email sent to ${testEmailAddress}`);
      setTestModalTemplate(null);
      setTestEmailAddress('');
    } catch (err) {
      alert('Failed to send test email');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Email Template Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure system notifications, credential dispatches, and invitation templates
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs flex justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg('')}>✕</button>
        </div>
      )}

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500 text-xs">
            Loading email templates...
          </div>
        ) : (
          templates.map((tpl) => (
            <div
              key={tpl._id}
              className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {tpl.isSystem ? 'System' : 'Custom'}
                    </span>
                    <button
                      onClick={() => handleToggleStatus(tpl)}
                      className={`text-[10px] px-2 py-0.5 rounded border font-semibold cursor-pointer ${
                        tpl.isActive
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-slate-500 bg-slate-800 border-slate-700'
                      }`}
                      title="Click to toggle status"
                    >
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mb-3 font-medium">Subject: {tpl.subject}</p>

                {tpl.variables?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tpl.variables.map((v) => (
                      <span
                        key={v}
                        className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-indigo-300 font-mono rounded"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleOpenPreview(tpl)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setTestModalTemplate(tpl)}
                  className="px-2.5 py-1 text-slate-400 hover:text-sky-400 flex items-center gap-1.5 hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test
                </button>
                <button
                  onClick={() => setSelectedTemplate(tpl)}
                  className="px-2.5 py-1 text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 hover:bg-slate-800 rounded cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Create New Email Template</h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Template Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Welcome Invitation"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Unique Slug (optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. welcome-invitation"
                    value={newTemplate.slug}
                    onChange={(e) => setNewTemplate({ ...newTemplate, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Subject Line *</label>
                <input
                  type="text"
                  required
                  placeholder="Welcome to AutoComm, {{clientName}}!"
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Variables (comma separated)</label>
                <input
                  type="text"
                  placeholder="clientName, adminName, loginUrl, temporaryPassword"
                  value={newTemplate.variables}
                  onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">HTML Body *</label>
                <textarea
                  rows={8}
                  required
                  placeholder="<p>Hi {{adminName}},</p><p>Your workspace is ready...</p>"
                  value={newTemplate.bodyHtml}
                  onChange={(e) => setNewTemplate({ ...newTemplate, bodyHtml: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedTemplate(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Edit Template: {selectedTemplate.name}</h3>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Email Subject *</label>
                <input
                  type="text"
                  required
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">HTML Body *</label>
                <textarea
                  rows={10}
                  required
                  value={selectedTemplate.bodyHtml}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, bodyHtml: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedTemplate.isActive}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, isActive: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700"
                  />
                  <span>Template Active</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => {
                setPreviewTemplate(null);
                setPreviewRendered(null);
              }}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-500 hover:text-black cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px] uppercase">
                Rendered Preview with Sample Data
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Subject: {previewRendered?.subject || previewTemplate.subject}
            </h3>
            <hr className="my-3 border-slate-200" />
            <div
              className="prose max-w-none text-xs"
              dangerouslySetInnerHTML={{ __html: previewRendered?.bodyHtml || previewTemplate.bodyHtml }}
            />
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {testModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setTestModalTemplate(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSendTest} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Send Test: {testModalTemplate.name}</h3>
              <div>
                <label className="text-slate-300 block mb-1">Recipient Email *</label>
                <input
                  type="email"
                  required
                  placeholder="tester@domain.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
              >
                Send Test Email
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

