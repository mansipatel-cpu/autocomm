import React, { useState, useEffect } from 'react';
import {
  Hash,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building2,
  AlertTriangle,
  X,
  ShieldAlert,
  PhoneForwarded,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';

export const PhoneNumbersPage = () => {
  const [numbers, setNumbers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailsNumber, setDetailsNumber] = useState(null);
  const [editingNumber, setEditingNumber] = useState(null);
  const [assigningNumber, setAssigningNumber] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [addModalError, setAddModalError] = useState('');

  // Add form state
  const [newNumber, setNewNumber] = useState({
    phoneNumber: '',
    friendlyName: '',
    country: 'US',
    type: 'Local',
    monthlyRate: 15,
    forwardingNumber: '',
    fallbackNumber: '',
    clientId: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    friendlyName: '',
    country: 'US',
    type: 'Local',
    monthlyRate: 15,
    forwardingNumber: '',
    fallbackNumber: '',
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: () => {},
  });

  const fetchNumbers = async () => {
    setLoading(true);
    try {
      const res = await superAdminApiClient.get('/phone-numbers', {
        params: {
          search,
          status: statusFilter,
          type: typeFilter,
          clientId: clientFilter,
          page,
          limit: 10,
        },
      });
      setNumbers(res.data.data.phoneNumbers || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to load phone numbers', err);
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
    fetchNumbers();
  }, [search, statusFilter, typeFilter, clientFilter, page]);

  const handleCreateNumber = async (e) => {
    e.preventDefault();
    setAddModalError('');
    try {
      await superAdminApiClient.post('/phone-numbers', newNumber);
      setActionMessage(`Phone number ${newNumber.phoneNumber} registered successfully.`);
      setIsAddModalOpen(false);
      setNewNumber({
        phoneNumber: '',
        friendlyName: '',
        country: 'US',
        type: 'Local',
        monthlyRate: 15,
        forwardingNumber: '',
        fallbackNumber: '',
        clientId: '',
      });
      fetchNumbers();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to add phone number';
      setAddModalError(errMsg);
    }
  };

  const handleOpenEdit = (num) => {
    setEditingNumber(num);
    setEditFormData({
      friendlyName: num.friendlyName || '',
      country: num.country || 'US',
      type: num.type || 'Local',
      monthlyRate: num.monthlyRate || 15,
      forwardingNumber: num.forwardingNumber || '',
      fallbackNumber: num.fallbackNumber || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await superAdminApiClient.put(`/phone-numbers/${editingNumber._id}`, editFormData);
      setActionMessage(`Phone number ${editingNumber.phoneNumber} updated.`);
      setEditingNumber(null);
      fetchNumbers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update phone number');
    }
  };

  const handleOpenAssign = (num) => {
    setAssigningNumber(num);
    setSelectedClientId(num.clientId?._id || num.clientId || '');
  };

  const handleSaveAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminApiClient.put(`/phone-numbers/${assigningNumber._id}/assign`, {
        clientId: selectedClientId || 'none',
      });
      setActionMessage(res.data.message || 'Assignment updated successfully');
      setAssigningNumber(null);
      fetchNumbers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign number');
    }
  };

  const handleToggleStatus = async (numId) => {
    try {
      await superAdminApiClient.patch(`/phone-numbers/${numId}/status`);
      fetchNumbers();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleDeleteNumber = (num) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Carrier Phone Number',
      message: `Permanently release and delete carrier number ${num.phoneNumber} from the platform inventory?`,
      confirmText: 'Delete Number',
      isDanger: true,
      onConfirm: async () => {
        try {
          await superAdminApiClient.delete(`/phone-numbers/${num._id}`);
          setActionMessage(`Number ${num.phoneNumber} removed from platform.`);
          fetchNumbers();
        } catch (err) {
          alert('Failed to delete number');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Phone Numbers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Provision carrier lines, manage single-tenant exclusive bindings, and routing
          </p>
        </div>
        <button
          onClick={() => {
            setAddModalError('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Phone Number
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Exclusivity Notice */}
      <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-300">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-[11px] text-slate-400">
          <strong className="text-amber-400">Section 21.20 Exclusivity Policy:</strong> Each carrier line operates under strict single-tenant allocation. Reassigning automatically transitions previous tenant binding and prevents conflicting concurrent ownership.
        </p>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by phone number or label..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="RELEASED">RELEASED</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Type: All</option>
            <option value="Local">Local</option>
            <option value="Toll-Free">Toll-Free</option>
            <option value="Mobile">Mobile</option>
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
              <option key={c.id || c._id} value={c.id || c._id}>
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
                <th className="py-3 px-4">Carrier Number</th>
                <th className="py-3 px-4">Friendly Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Assigned Tenant</th>
                <th className="py-3 px-4">Monthly Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading carrier numbers...
                  </td>
                </tr>
              ) : numbers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No phone numbers match your criteria.
                  </td>
                </tr>
              ) : (
                numbers.map((n) => (
                  <tr key={n._id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-indigo-400">{n.phoneNumber}</td>
                    <td className="py-3 px-4 font-semibold text-white">{n.friendlyName || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                        {n.type || 'Local'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {n.clientId ? (
                        <span className="text-white font-medium flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          {n.clientId?.companyName || 'Assigned'}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Unassigned (Available)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">${n.monthlyRate || 15}/mo</td>
                    <td className="py-3 px-4">
                      {n.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          ACTIVE
                        </span>
                      ) : n.status === 'AVAILABLE' ? (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-semibold">
                          AVAILABLE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          RELEASED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsNumber(n)}
                          title="View Details"
                          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAssign(n)}
                          title="Assign / Reassign Client"
                          className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(n)}
                          title="Edit Number"
                          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(n._id)}
                          title="Toggle Status"
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                        >
                          {n.status === 'ACTIVE' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteNumber(n)}
                          title="Delete Number"
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
            Showing {numbers.length > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
            {Math.min(page * 10, total)} of {total} numbers
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

      {/* Add Number Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleCreateNumber} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Add New Phone Number</h3>

              {addModalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                  {addModalError}
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Carrier Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+14155552671"
                  value={newNumber.phoneNumber}
                  onChange={(e) => setNewNumber({ ...newNumber, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Friendly Label</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Inbound Line"
                  value={newNumber.friendlyName}
                  onChange={(e) => setNewNumber({ ...newNumber, friendlyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Number Type</label>
                  <select
                    value={newNumber.type}
                    onChange={(e) => setNewNumber({ ...newNumber, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Local">Local</option>
                    <option value="Toll-Free">Toll-Free</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Monthly Rate ($)</label>
                  <input
                    type="number"
                    value={newNumber.monthlyRate}
                    onChange={(e) => setNewNumber({ ...newNumber, monthlyRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Assign Client Workspace</label>
                <select
                  value={newNumber.clientId}
                  onChange={(e) => setNewNumber({ ...newNumber, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Leave Unassigned (Available in Pool)</option>
                  {clients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
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
                  Register Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Client Modal */}
      {assigningNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAssigningNumber(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveAssign} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Assign Phone Number</h3>
              <p className="text-slate-400 font-mono">{assigningNumber.phoneNumber}</p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Client Workspace *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Unassign (Return to Available Pool)</option>
                  {clients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.companyName} ({c.clientCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 leading-relaxed">
                Single-tenant binding: Assigning this number will link it exclusively to this client workspace.
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningNumber(null)}
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

      {/* Edit Number Modal */}
      {editingNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingNumber(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <h3 className="text-base font-bold text-white mb-2">Edit Phone Number</h3>
              <p className="text-slate-400 font-mono">{editingNumber.phoneNumber}</p>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Friendly Label</label>
                <input
                  type="text"
                  value={editFormData.friendlyName}
                  onChange={(e) => setEditFormData({ ...editFormData, friendlyName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Number Type</label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Local">Local</option>
                    <option value="Toll-Free">Toll-Free</option>
                    <option value="Mobile">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Monthly Rate ($)</label>
                  <input
                    type="number"
                    value={editFormData.monthlyRate}
                    onChange={(e) => setEditFormData({ ...editFormData, monthlyRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingNumber(null)}
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

      {/* Details Modal */}
      {detailsNumber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setDetailsNumber(null)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Phone Number Details</h3>
            <p className="font-mono text-indigo-400 mb-4">{detailsNumber.phoneNumber}</p>

            <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Friendly Name:</span>
                <span className="text-white font-medium">{detailsNumber.friendlyName || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assigned Client:</span>
                <span className="text-white font-medium">
                  {detailsNumber.clientId?.companyName || 'Unassigned (Available)'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Carrier Type:</span>
                <span className="text-white">{detailsNumber.type || 'Local'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-semibold">{detailsNumber.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Monthly Cost:</span>
                <span className="text-white font-mono">${detailsNumber.monthlyRate || 15}/mo</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assigned Voice Agent:</span>
                <span className="text-white">{detailsNumber.assignedAgentName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created:</span>
                <span className="text-slate-300">
                  {detailsNumber.createdAt ? new Date(detailsNumber.createdAt).toLocaleString() : '—'}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setDetailsNumber(null)}
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
