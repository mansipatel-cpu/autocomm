import React, { useState, useEffect } from 'react';
import {
  Link2,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  Radio,
  FileText,
  X,
  UserCheck,
  Server,
  Activity,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';

export const IncomingConnectionsPage = () => {
  const [connections, setConnections] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState(null);
  const [assigningConnection, setAssigningConnection] = useState(null);
  const [logsConnection, setLogsConnection] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Add form state
  const [newConnection, setNewConnection] = useState({
    name: '',
    provider: 'Twilio',
    phoneNumber: '',
    webhookUrl: '',
    clientId: '',
    status: 'ACTIVE',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    provider: 'Twilio',
    phoneNumber: '',
    webhookUrl: '',
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: () => {},
  });

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await superAdminApiClient.get('/incoming-connections', {
        params: {
          search,
          provider: providerFilter,
          status: statusFilter,
          clientId: clientFilter,
          page,
          limit: 10,
        },
      });
      setConnections(res.data.data.connections || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to load incoming connections', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await superAdminApiClient.get('/clients', { params: { limit: 100 } });
      setClients(res.data.data.clients || []);
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [search, providerFilter, statusFilter, clientFilter, page]);

  const handleCreateConnection = async (e) => {
    e.preventDefault();
    try {
      await superAdminApiClient.post('/incoming-connections', newConnection);
      setActionMessage(`Connection "${newConnection.name}" established successfully.`);
      setIsAddModalOpen(false);
      setNewConnection({
        name: '',
        provider: 'Twilio',
        phoneNumber: '',
        webhookUrl: '',
        clientId: '',
        status: 'ACTIVE',
      });
      fetchConnections();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to create connection');
    }
  };

  const handleOpenEdit = (conn) => {
    setEditingConnection(conn);
    setEditFormData({
      name: conn.name,
      provider: conn.provider || 'Twilio',
      phoneNumber: conn.phoneNumber || '',
      webhookUrl: conn.webhookUrl || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await superAdminApiClient.put(`/incoming-connections/${editingConnection._id}`, editFormData);
      setActionMessage(`Connection "${editingConnection.name}" updated.`);
      setEditingConnection(null);
      fetchConnections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update connection');
    }
  };

  const handleOpenAssign = (conn) => {
    setAssigningConnection(conn);
    setSelectedClientId(conn.clientId?._id || conn.clientId || '');
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminApiClient.put(`/incoming-connections/${assigningConnection._id}/assign`, {
        clientId: selectedClientId || 'none',
      });
      setActionMessage(res.data.message || 'Client assignment updated');
      setAssigningConnection(null);
      fetchConnections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign client');
    }
  };

  const handleToggleStatus = async (connId) => {
    try {
      await superAdminApiClient.patch(`/incoming-connections/${connId}/status`);
      fetchConnections();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleOpenLogs = async (conn) => {
    setLogsConnection(conn);
    setLoadingLogs(true);
    try {
      const res = await superAdminApiClient.get(`/incoming-connections/${conn._id}/logs`);
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load logs', err);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDeleteConnection = (conn) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Incoming Connection',
      message: `Permanently delete trunk connection "${conn.name}" (${conn.provider})? This will disconnect incoming call routing for associated channels.`,
      confirmText: 'Delete Connection',
      isDanger: true,
      onConfirm: async () => {
        try {
          await superAdminApiClient.delete(`/incoming-connections/${conn._id}`);
          setActionMessage(`Connection "${conn.name}" deleted.`);
          fetchConnections();
        } catch (err) {
          alert('Failed to delete connection');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Incoming Connections Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage provider trunks, SIP endpoints, Meta WABA webhooks, and client assignments
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Connection
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search connection name or number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Provider filter */}
          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Provider: All</option>
            <option value="Twilio">Twilio</option>
            <option value="Plivo">Plivo</option>
            <option value="Meta WABA">Meta WABA</option>
            <option value="SIP Trunk">SIP Trunk</option>
            <option value="Vonage">Vonage</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={(e) => {
              setClientFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Client: All</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] bg-slate-900/60">
                <th className="py-3 px-4">Connection Name</th>
                <th className="py-3 px-4">Provider / Type</th>
                <th className="py-3 px-4">Phone / Endpoint</th>
                <th className="py-3 px-4">Assigned Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading incoming connections...
                  </td>
                </tr>
              ) : connections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No incoming connections configured yet.
                  </td>
                </tr>
              ) : (
                connections.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-semibold text-indigo-300">
                        {c.provider}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {c.phoneNumber || c.webhookUrl || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {c.clientId ? (
                        <span className="text-white font-medium flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          {c.clientId?.companyName || 'Assigned'}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Global / Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {c.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenLogs(c)}
                          title="View Logs"
                          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAssign(c)}
                          title="Assign to Client"
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Connection"
                          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c._id)}
                          title="Toggle Status"
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          {c.status === 'ACTIVE' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteConnection(c)}
                          title="Delete Connection"
                          className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {connections.length > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
            {Math.min(page * 10, total)} of {total} connections
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="text-white font-medium">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Connection Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateConnection} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Create Incoming Connection</h3>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Connection Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. US Primary SIP Trunk"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Provider Type *</label>
                <select
                  value={newConnection.provider}
                  onChange={(e) => setNewConnection({ ...newConnection, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Twilio">Twilio Voice Trunk</option>
                  <option value="Plivo">Plivo SIP Trunk</option>
                  <option value="Meta WABA">Meta WhatsApp WABA Webhook</option>
                  <option value="SIP Trunk">Custom SIP Trunk</option>
                  <option value="Vonage">Vonage Voice API</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Associated Phone / DID Number</label>
                <input
                  type="text"
                  placeholder="+14155550199"
                  value={newConnection.phoneNumber}
                  onChange={(e) => setNewConnection({ ...newConnection, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Webhook / SIP Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://api.autocomm.io/webhooks/sip"
                  value={newConnection.webhookUrl}
                  onChange={(e) => setNewConnection({ ...newConnection, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Assign Client Workspace</label>
                <select
                  value={newConnection.clientId}
                  onChange={(e) => setNewConnection({ ...newConnection, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Global / Unassigned</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Create Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Connection Modal */}
      {editingConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingConnection(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Edit Incoming Connection</h3>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Connection Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Provider Type *</label>
                <select
                  value={editFormData.provider}
                  onChange={(e) => setEditFormData({ ...editFormData, provider: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Twilio">Twilio Voice Trunk</option>
                  <option value="Plivo">Plivo SIP Trunk</option>
                  <option value="Meta WABA">Meta WhatsApp WABA Webhook</option>
                  <option value="SIP Trunk">Custom SIP Trunk</option>
                  <option value="Vonage">Vonage Voice API</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Associated Phone / DID Number</label>
                <input
                  type="text"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={editFormData.webhookUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingConnection(null)}
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
            </form>
          </div>
        </div>
      )}

      {/* Assign Client Modal */}
      {assigningConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAssigningConnection(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveAssign} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Assign Connection to Client</h3>
              <p className="text-slate-400">{assigningConnection.name}</p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Client Workspace *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Global / Unassigned</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.companyName} ({c.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningConnection(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {logsConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative text-xs max-h-[85vh] flex flex-col">
            <button
              onClick={() => setLogsConnection(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-white">Connection Logs</h3>
              <p className="text-slate-400">{logsConnection.name} ({logsConnection.provider})</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {loadingLogs ? (
                <p className="text-slate-500 py-6 text-center">Loading connection logs...</p>
              ) : logs.length === 0 ? (
                <p className="text-slate-500 py-6 text-center">No activity logs recorded yet.</p>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg font-mono text-[11px]">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-400">{log.event}</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</span>
                    </div>
                    <p className="text-slate-300">{log.details}</p>
                    {log.status && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-emerald-400 font-semibold">
                        {log.status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setLogsConnection(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
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
