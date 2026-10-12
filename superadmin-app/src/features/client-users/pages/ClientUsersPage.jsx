import React, { useState, useEffect } from 'react';
import { Users2, Search, Plus, CheckCircle, XCircle, Trash2, X } from 'lucide-react';
import { superAdminApiClient } from '../../../shared/api/client';

export const ClientUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    clientId: '',
    name: '',
    email: '',
    contactNumber: '',
    role: 'Admin Operator',
  });
  const [createdPassword, setCreatedPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await superAdminApiClient.get('/client-users', {
        params: {
          search,
          clientId: selectedClient,
          page,
          limit: 10,
        },
      });
      setUsers(res.data.data.users);
      setTotal(res.data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await superAdminApiClient.get('/clients', { params: { limit: 100 } });
      setClients(res.data.data.clients);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, selectedClient, page]);

  const handleToggleStatus = async (userId) => {
    try {
      await superAdminApiClient.patch(`/client-users/${userId}/toggle-status`);
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user?')) return;
    try {
      await superAdminApiClient.delete(`/client-users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminApiClient.post('/client-users', newUser);
      setCreatedPassword(res.data.data.temporaryPassword);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Client User Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage users and roles across all client workspaces</p>
        </div>
        <button
          onClick={() => {
            setCreatedPassword('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Client User
        </button>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">Filter by Client: All</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.companyName} ({c.clientCode})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] bg-slate-900/60">
              <th className="py-3 px-4">User Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Login</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">Loading client users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">No client users found.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                  <td className="py-3 px-4 text-slate-400">{u.email}</td>
                  <td className="py-3 px-4 text-indigo-400 font-medium">
                    {u.clientId?.companyName || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.status === 'active' ? (
                      <span className="text-emerald-400 font-semibold">Active</span>
                    ) : (
                      <span className="text-slate-500">Inactive</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleToggleStatus(u._id)}
                      className="p-1 text-slate-400 hover:text-white mr-2"
                      title="Toggle active status"
                    >
                      {u.status === 'active' ? <XCircle className="w-3.5 h-3.5 text-rose-400" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                      title="Delete user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdPassword ? (
              <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
                <h3 className="text-base font-bold text-white mb-2">Add New Client User</h3>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Select Client Company *</label>
                  <select
                    required
                    value={newUser.clientId}
                    onChange={(e) => setNewUser({ ...newUser, clientId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName} ({c.clientCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">User Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="System Admin">System Admin</option>
                    <option value="Admin Operator">Admin Operator</option>
                    <option value="Inbox Agent">Inbox Agent</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-3">
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
                    Create User
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">User Created Successfully!</h3>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                  <p className="text-slate-400">Temporary Password Generated:</p>
                  <code className="text-amber-400 font-mono text-sm block bg-slate-800 p-2 rounded">
                    {createdPassword}
                  </code>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
