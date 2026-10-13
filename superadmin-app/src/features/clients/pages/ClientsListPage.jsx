import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  KeyRound,
  Trash2,
  Mail,
  Eye,
  Edit,
  Hash,
  Coins,
  Shield,
  Send,
} from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';
import { CreateClientModal } from '../components/CreateClientModal';
import { EditClientModal } from '../components/EditClientModal';
import { ClientDetailsModal } from '../components/ClientDetailsModal';
import { ManageClientPhonesModal } from '../components/ManageClientPhonesModal';
import { ManageCreditsModal } from '../../dashboard/components/ManageCreditsModal';
import { ConfirmationModal } from '../../../shared/components/ConfirmationModal';

export const ClientsListPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [creditFilter, setCreditFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailsClient, setDetailsClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [managingPhonesClient, setManagingPhonesClient] = useState(null);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDanger: true,
    onConfirm: () => {},
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await superAdminApiClient.get('/clients', {
        params: {
          search,
          status: statusFilter,
          plan: planFilter,
          page,
          limit: 10,
        },
      });
      let clientList = res.data.data.clients || [];

      // Optional frontend credit filter
      if (creditFilter === 'zero') {
        clientList = clientList.filter((c) => (c.credits || 0) <= 0);
      } else if (creditFilter === 'low') {
        clientList = clientList.filter((c) => (c.credits || 0) > 0 && (c.credits || 0) <= 500);
      } else if (creditFilter === 'normal') {
        clientList = clientList.filter((c) => (c.credits || 0) > 500);
      }

      setClients(clientList);
      setTotalPages(res.data.data.totalPages || 1);
      setTotal(res.data.data.total || 0);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter, planFilter, creditFilter, page]);

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      await superAdminApiClient.patch(`/clients/${clientId}/status`, { status: newStatus });
      setActionMessage(`Client status updated to ${newStatus}`);
      fetchClients();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleResendCredentials = (client) => {
    setConfirmModal({
      isOpen: true,
      title: 'Resend Client Admin Credentials',
      message: `Send an email with workspace access credentials to ${client.adminEmail}?`,
      confirmText: 'Send Credentials',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await superAdminApiClient.post(`/clients/${client._id}/resend-credentials`);
          const tempPass = res.data?.data?.temporaryPassword;
          setActionMessage(
            `Credentials resent to ${client.adminEmail}.${tempPass ? ` New Temporary Password: ${tempPass}` : ''}`
          );
        } catch (err) {
          alert(err.response?.data?.message || err.response?.data?.error || 'Failed to resend credentials');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleResetPassword = (clientId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Client Password',
      message: 'Are you sure you want to reset this client admin password and send new credentials to their registered email?',
      confirmText: 'Reset Password',
      isDanger: false,
      onConfirm: async () => {
        try {
          const res = await superAdminApiClient.post(`/clients/${clientId}/reset-password`);
          const tempPass = res.data?.data?.temporaryPassword;
          setActionMessage(
            `Password reset successfully for ${res.data.data.email}.${tempPass ? ` New Temporary Password: ${tempPass}` : ''}`
          );
        } catch (err) {
          alert(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteClient = (clientId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Client Workspace',
      message: 'WARNING: Are you sure you want to permanently delete this client and all associated tenant records, users, and channels? This action cannot be undone.',
      confirmText: 'Delete Client',
      isDanger: true,
      onConfirm: async () => {
        try {
          await superAdminApiClient.delete(`/clients/${clientId}`);
          setActionMessage('Client removed successfully');
          fetchClients();
        } catch (err) {
          alert('Failed to delete client');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold uppercase">Active</span>;
      case 'suspended':
        return <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold uppercase">Suspended</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] font-semibold uppercase">Inactive</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client Tenant Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control company workspaces, credentials, credits, and provisioning</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Client
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, email, code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Plan: All</option>
            <option value="Enterprise Scale">Enterprise Scale</option>
            <option value="Growth">Growth</option>
            <option value="Starter">Starter</option>
          </select>

          <select
            value={creditFilter}
            onChange={(e) => {
              setCreditFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Credits: All</option>
            <option value="normal">Normal (> 500)</option>
            <option value="low">Low (1 - 500)</option>
            <option value="zero">Out of Credits (0)</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] bg-slate-900/60">
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Assigned Phone</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No client accounts match your criteria.
                  </td>
                </tr>
              ) : (
                clients.map((c) => {
                  const assignedPhone = c.assignedPhoneNumber || (c.phoneNumbers && c.phoneNumbers[0]) || '—';
                  return (
                    <tr key={c._id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-400">{c.clientCode}</td>
                      <td className="py-3 px-4 font-semibold text-white">{c.companyName}</td>
                      <td className="py-3 px-4 text-slate-400">{c.adminEmail}</td>
                      <td className="py-3 px-4 text-slate-400">{c.contactNumber || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{assignedPhone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                          {c.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{c.credits?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setDetailsClient(c)}
                            title="View Client Details"
                            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit Client */}
                          <button
                            onClick={() => setEditingClient(c)}
                            title="Edit Client"
                            className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {/* Resend Credentials */}
                          <button
                            onClick={() => handleResendCredentials(c)}
                            title="Resend Credentials"
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          {/* Manage Phone Numbers */}
                          <button
                            onClick={() => setManagingPhonesClient(c)}
                            title="Manage Assigned Phone Numbers"
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Hash className="w-3.5 h-3.5" />
                          </button>
                          {/* Reset Password */}
                          <button
                            onClick={() => handleResetPassword(c._id)}
                            title="Reset Admin Password & Resend"
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {/* Toggle Status */}
                          {c.status === 'active' ? (
                            <button
                              onClick={() => handleStatusChange(c._id, 'suspended')}
                              title="Suspend Client"
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(c._id, 'active')}
                              title="Activate Client"
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClient(c._id)}
                            title="Delete Client"
                            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {clients.length > 0 ? (page - 1) * 10 + 1 : 0} to{' '}
            {Math.min(page * 10, total)} of {total} clients
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

      {/* Modals */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClientCreated={() => {
          fetchClients();
          setActionMessage('New client tenant account provisioned successfully.');
        }}
      />

      <ClientDetailsModal
        isOpen={!!detailsClient}
        client={detailsClient}
        onClose={() => setDetailsClient(null)}
        onManageCredits={(cl) => {
          setDetailsClient(null);
          setIsCreditsModalOpen(true);
        }}
        onManagePhones={(cl) => {
          setDetailsClient(null);
          setManagingPhonesClient(cl);
        }}
      />

      <EditClientModal
        isOpen={!!editingClient}
        client={editingClient}
        onClose={() => setEditingClient(null)}
        onClientUpdated={() => {
          fetchClients();
          setActionMessage('Client updated successfully.');
        }}
      />

      <ManageClientPhonesModal
        isOpen={!!managingPhonesClient}
        client={managingPhonesClient}
        onClose={() => setManagingPhonesClient(null)}
        onUpdated={() => {
          fetchClients();
          setActionMessage('Assigned carrier phone numbers updated.');
        }}
      />

      <ManageCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        onUpdated={fetchClients}
      />

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

