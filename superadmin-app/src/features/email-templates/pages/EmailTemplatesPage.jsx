import React, { useState, useEffect } from 'react';
import { Mail, Edit3, Send, Eye, CheckCircle2, X } from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const EmailTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Template Modal
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testModalTemplate, setTestModalTemplate] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Email Template Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure system notifications, credential dispatches, and invitation templates
          </p>
        </div>
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
                  {tpl.isActive ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
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
                  onClick={() => setPreviewTemplate(tpl)}
                  className="px-2.5 py-1 text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800 rounded"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setTestModalTemplate(tpl)}
                  className="px-2.5 py-1 text-slate-400 hover:text-sky-400 flex items-center gap-1.5 hover:bg-slate-800 rounded"
                >
                  <Send className="w-3.5 h-3.5" />
                  Test
                </button>
                <button
                  onClick={() => setSelectedTemplate(tpl)}
                  className="px-2.5 py-1 text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 hover:bg-slate-800 rounded"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto text-slate-900">
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Subject: {previewTemplate.subject}</h3>
            <hr className="my-3" />
            <div dangerouslySetInnerHTML={{ __html: previewTemplate.bodyHtml }} />
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
