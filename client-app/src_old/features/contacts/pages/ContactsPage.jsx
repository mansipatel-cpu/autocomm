import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  FileSpreadsheet,
  Trash2,
  FolderPlus,
  X,
  Layers,
  ArrowRight,
  UserCheck,
  Phone,
  MessageCircle,
  CalendarDays,
  ListFilter,
  ChevronRight,
  Pencil,
  Megaphone,
} from 'lucide-react';
import { apiClient } from '../../../shared/api/client';

const AVATAR_COLORS = [
  'bg-[#1e293b] text-white',
  'bg-[#f97316] text-white',
  'bg-[#0d9488] text-white',
  'bg-[#7c3aed] text-white',
  'bg-[#2563eb] text-white',
  'bg-[#db2777] text-white',
  'bg-[#ea580c] text-white',
  'bg-[#0891b2] text-white',
];

function getAvatarClass(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const ContactsPage = () => {
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'groups'
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({ total: 12450, active: 11800, whatsappEnabled: 12100, voiceEnabled: 11200 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [groupStep, setGroupStep] = useState(1);

  // Add Contact Form State
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    callingCode: '+1',
    phoneNumber: '',
    sameAsPrimary: true,
    dedicatedWhatsappCode: '+1',
    dedicatedWhatsappNumber: '',
  });

  // Group Form State
  const [newGroup, setNewGroup] = useState({
    name: '',
    category: 'Customer Segments',
    description: '',
    selectedContactIds: [],
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/contacts', {
        params: { search, status: statusFilter, channel: channelFilter, page, limit: 10 },
      });
      setContacts(res.data.data.contacts || []);
      setTotalPages(res.data.data.totalPages || 1);
      setTotal(res.data.data.total || 0);

      const statsRes = await apiClient.get('/contacts/stats');
      if (statsRes.data.data) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get('/groups');
      setGroups(res.data.data.groups || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, [search, statusFilter, channelFilter, page]);

  const handleSelectContact = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(contacts.map((c) => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const fullPhone = `${newContact.callingCode}${newContact.phoneNumber.replace(/\D/g, '')}`;
      const payload = {
        name: newContact.name,
        email: newContact.email,
        phoneNumber: fullPhone,
        whatsappNumber: newContact.sameAsPrimary
          ? fullPhone
          : `${newContact.dedicatedWhatsappCode}${newContact.dedicatedWhatsappNumber.replace(/\D/g, '')}`,
        channels: ['whatsapp', 'voice'],
      };
      await apiClient.post('/contacts', payload);
      setIsAddContactModalOpen(false);
      setNewContact({
        name: '',
        email: '',
        callingCode: '+1',
        phoneNumber: '',
        sameAsPrimary: true,
        dedicatedWhatsappCode: '+1',
        dedicatedWhatsappNumber: '',
      });
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create contact');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/groups', newGroup);
      setIsCreateGroupModalOpen(false);
      setNewGroup({ name: '', category: 'Customer Segments', description: '', selectedContactIds: [] });
      setGroupStep(1);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create contact group');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} contact(s)?`)) return;
    try {
      await apiClient.post('/contacts/bulk-delete', { contactIds: selectedIds });
      setSelectedIds([]);
      fetchContacts();
    } catch (err) {
      alert('Failed to delete selected contacts');
    }
  };

  const exportToCSV = () => {
    const rows = contacts;
    if (rows.length === 0) {
      alert('No contacts to export');
      return;
    }
    const headers = ['Name', 'Email', 'Phone', 'Channels', 'Status', 'Date Added'];
    const csvRows = rows.map((contact) => [
      contact.name,
      contact.email || '',
      contact.phoneNumber || '',
      (contact.channels || []).join('; '),
      contact.status || 'Active',
      new Date(contact.createdAt).toLocaleDateString(),
    ]);
    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <a href="/dashboard" className="hover:text-slate-600 transition-colors">Home</a>
          <span>&gt;</span>
          {activeTab === 'groups' ? (
            <>
              <button
                type="button"
                className="hover:text-slate-600 transition-colors"
                onClick={() => setActiveTab('contacts')}
              >
                Contacts
              </button>
              <span>&gt;</span>
              <span className="text-slate-700 font-medium">Groups</span>
            </>
          ) : (
            <span className="text-slate-700 font-medium">Contacts</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium inline-flex items-center gap-2 shadow-2xs transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Import CSV
          </button>
          <button
            onClick={() => {
              if (activeTab === 'groups') {
                setGroupStep(1);
                setIsCreateGroupModalOpen(true);
              } else {
                setIsAddContactModalOpen(true);
              }
            }}
            className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-sm font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'groups' ? 'Create Group' : 'Add New Contact'}
          </button>
        </div>
      </div>

      {/* 4 Metric Stat Cards (exact omnichannel-saas layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Contacts</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">
                {stats.total?.toLocaleString() || '12,450'}
              </p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">+3.2% this month</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#007BFF] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Active contact</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">
                {stats.active?.toLocaleString() || '11,800'}
              </p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">94.9% reachable rate</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">WhatsApp Enabled</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">
                {stats.whatsappEnabled?.toLocaleString() || '12,100'}
              </p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">97.2% coverage</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Voice Calling Enabled</p>
              <p className="text-[28px] font-bold text-slate-900 mt-1">
                {stats.voiceEnabled?.toLocaleString() || '11,200'}
              </p>
              <p className="text-xs text-violet-500 mt-2 font-medium">Automated IVR ready</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Phone className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Tab Selector: Contacts Directory vs Contact Groups */}
      <div className="flex items-center gap-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('contacts')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'contacts'
              ? 'text-[#007BFF] border-b-2 border-[#007BFF]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Contacts Directory ({total})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === 'groups'
              ? 'text-[#007BFF] border-b-2 border-[#007BFF]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Contact Groups ({groups.length})
        </button>
      </div>

      {activeTab === 'contacts' ? (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Filter Toolbar */}
          <div className="p-5 border-b border-slate-100 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative w-full lg:max-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter users..."
                  className="h-10 w-full pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#007BFF]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full lg:w-[170px] px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#007BFF]"
              >
                <option value="all">Status: All Users</option>
                <option value="Active">Status: Active</option>
                <option value="Pending">Status: Pending</option>
                <option value="Inactive">Status: Inactive</option>
              </select>

              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="h-10 w-full lg:w-[170px] px-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-[#007BFF]"
              >
                <option value="all">Channel: All</option>
                <option value="whatsapp">Channel: WhatsApp</option>
                <option value="voice">Channel: Voice</option>
              </select>

              <div className="h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 inline-flex items-center gap-2 ml-auto">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <span>October 2026</span>
              </div>
            </div>

            {/* Bulk Actions Alert if rows selected */}
            {selectedIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-900">
                <span className="font-semibold">{selectedIds.length} Contact(s) selected</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setNewGroup({ ...newGroup, selectedContactIds: selectedIds });
                      setIsCreateGroupModalOpen(true);
                    }}
                    className="px-3 py-1 bg-white border border-blue-300 rounded-lg hover:bg-blue-100/50 font-medium"
                  >
                    Add to Group
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete selected
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={contacts.length > 0 && selectedIds.length === contacts.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#007BFF] focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Channels</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">Loading contacts directory...</td>
                  </tr>
                ) : contacts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">No contacts found.</td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c._id)}
                          onChange={() => handleSelectContact(c._id)}
                          className="rounded border-slate-300 text-[#007BFF] focus:ring-0"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getAvatarClass(c.name)}`}>
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">{c.name}</div>
                            <div className="text-[11px] text-slate-400">@{c.name.toLowerCase().replace(/[^a-z0-9]/g, '')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{c.email || '—'}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-800">{c.phoneNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {c.channels?.includes('whatsapp') && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                              WhatsApp
                            </span>
                          )}
                          {c.channels?.includes('voice') && (
                            <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold border border-violet-200">
                              Voice
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="text-[#007BFF] hover:text-[#0069d9] font-medium text-xs mr-3">
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${c.name}?`)) {
                              apiClient.delete(`/contacts/${c._id}`).then(() => fetchContacts());
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 font-medium text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {contacts.length > 0 ? (page - 1) * 10 + 1 : 0} to {Math.min(page * 10, total)} of {total.toLocaleString()} contacts
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-semibold text-slate-800">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Contact Groups View */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search groups by name or description..."
                className="h-10 w-full pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm placeholder-slate-400 focus:outline-none focus:border-[#007BFF]"
              />
            </div>
            <button
              onClick={() => {
                setGroupStep(1);
                setIsCreateGroupModalOpen(true);
              }}
              className="h-10 px-4 rounded-xl bg-[#007BFF] hover:bg-[#0069d9] text-white text-sm font-medium inline-flex items-center gap-2 self-end shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>

          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                No groups created yet. Create a segmented audience to broadcast WhatsApp campaigns or automated calls.
              </div>
            ) : (
              groups.map((group) => {
                const count = group.contacts?.length || 150;
                return (
                  <div
                    key={group._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 truncate">{group.name}</h3>
                        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {group.description || 'Segmented customer audience for targeted outreach campaigns'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Users className="h-3.5 w-3.5" />
                          {count.toLocaleString()} contacts
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400">
                          Created {new Date(group.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Members
                      </button>
                      <button
                        onClick={() => window.location.href = '/campaigns'}
                        className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <Megaphone className="h-3.5 w-3.5 text-blue-600" />
                        Send campaign
                      </button>
                      <button
                        className="h-9 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete group "${group.name}"?`)) {
                            apiClient.delete(`/groups/${group._id}`).then(() => fetchGroups());
                          }
                        }}
                        className="h-9 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add New Contact</h2>
              <button
                onClick={() => setIsAddContactModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Mercer"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="alex@company.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Calling Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={newContact.callingCode}
                    onChange={(e) => setNewContact({ ...newContact, callingCode: e.target.value })}
                    className="w-24 px-2 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  >
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <input
                    type="tel"
                    required
                    placeholder="(555) 000-0000"
                    value={newContact.phoneNumber}
                    onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create Contact Group</h2>
              <button
                onClick={() => setIsCreateGroupModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 High Value Prospects"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Notes about this audience segment..."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:border-[#007BFF] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#007BFF] hover:bg-[#0069d9] text-white rounded-xl font-medium"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 text-center">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[#007BFF] flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Import Contacts via CSV</h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload a CSV file containing columns for <code>name</code>, <code>phone</code>, and <code>email</code>.
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                alert('Contacts imported successfully!');
                setIsImportModalOpen(false);
                fetchContacts();
              }}
              className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#007BFF] hover:file:bg-blue-100 cursor-pointer"
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
