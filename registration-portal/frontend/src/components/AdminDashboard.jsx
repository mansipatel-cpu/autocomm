import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';
import { StatusBadge } from './StatusBadge.jsx';
import {
  Search,
  RefreshCw,
  RotateCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Send,
  X,
  Trash2,
} from 'lucide-react';

export function AdminDashboard({ token, onLogout }) {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, inProgress: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedError, setSelectedError] = useState(null);

  // Webhook Simulator State
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookPhone, setWebhookPhone] = useState('');
  const [webhookType, setWebhookType] = useState('message');
  const [webhookStatus, setWebhookStatus] = useState('delivered');
  const [webhookSecret, setWebhookSecret] = useState('webhook_secret_key_123');
  const [webhookResult, setWebhookResult] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [regsRes, statsRes] = await Promise.all([
        api.getRegistrations(token, search),
        api.getStats(token),
      ]);

      if (regsRes.success) {
        setRegistrations(regsRes.data.rows || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      const res = await api.retryRegistration(token, id);
      if (res.success) {
        await fetchData();
      } else {
        alert(`Retry failed: ${res.error}`);
      }
    } catch (err) {
      alert(`Retry request failed: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (id, phone) => {
    if (!window.confirm(`Are you sure you want to delete registration for ${phone}?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await api.deleteRegistration(token, id);
      if (res.success) {
        await fetchData();
      } else {
        alert(`Delete failed: ${res.error}`);
      }
    } catch (err) {
      alert(`Delete request failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL registrations from the status list?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.clearAllRegistrations(token);
      if (res.success) {
        await fetchData();
      } else {
        alert(`Clear all failed: ${res.error}`);
      }
    } catch (err) {
      alert(`Clear all failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendWebhook = async (e) => {
    e.preventDefault();
    setWebhookResult('Sending webhook event...');
    try {
      const payload = {
        event: `${webhookType}.${webhookStatus}`,
        type: webhookType,
        phone: webhookPhone.trim(),
        status: webhookStatus,
        timestamp: new Date().toISOString(),
      };

      const res = await api.triggerWebhook(webhookSecret, payload);
      if (res.success) {
        setWebhookResult(`Webhook processed successfully! Status updated to '${webhookStatus}'`);
        await fetchData();
      } else {
        setWebhookResult(`Webhook rejected: ${res.error}`);
      }
    } catch (err) {
      setWebhookResult(`Error sending webhook: ${err.message}`);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Registration Pipeline Status
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '2px' }}>
            Real-time synchronization logs with AutoComm WhatsApp and Voice Calling APIs.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowWebhookModal(true)}
            style={{ color: '#4f46e5', borderColor: '#c7d2fe' }}
          >
            <Send size={15} /> Simulate Webhook
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={fetchData}
            title="Refresh Table"
          >
            <RefreshCw size={15} className={loading ? 'spinner' : ''} /> Refresh
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onLogout}
            style={{ color: '#ef4444' }}
            title="Log Out"
          >
            <LogOut size={15} /> Exit Admin
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Registrations</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '10px' }}>
            {stats.total}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>Fully Completed</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#047857', marginTop: '10px' }}>
            {stats.completed}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600 }}>Failed / Needs Retry</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b91c1c', marginTop: '10px' }}>
            {stats.failed}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600 }}>In Progress</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#b45309', marginTop: '10px' }}>
            {stats.inProgress}
          </div>
        </div>
      </div>

      {/* Search Box & Table Header */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, phone, email, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Showing <strong>{registrations.length}</strong> records
            </div>
            {registrations.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Delete all records from the status list"
              >
                <Trash2 size={12} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Registrations Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Phone (E.164)</th>
                <th>Registered At</th>
                <th>Contact Status</th>
                <th>Message Status</th>
                <th>Call Status</th>
                <th>Error</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{row.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.email}</div>
                    {row.company && (
                      <span style={{ fontSize: '0.725rem', color: '#4f46e5', background: '#eef2ff', padding: '1px 6px', borderRadius: '4px', marginTop: '2px', display: 'inline-block' }}>
                        {row.company}
                      </span>
                    )}
                  </td>
                  <td>
                    <code style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                      {row.phone}
                    </code>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatDate(row.created_at)}
                  </td>
                  <td>
                    <StatusBadge status={row.contact_status} type="contact" />
                  </td>
                  <td>
                    <StatusBadge status={row.message_status} type="message" />
                  </td>
                  <td>
                    <StatusBadge status={row.call_status} type="call" />
                  </td>
                  <td>
                    {row.last_error ? (
                      <button
                        type="button"
                        onClick={() => setSelectedError({ name: row.full_name, error: row.last_error, step: row.last_failed_step })}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          color: '#b91c1c',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertTriangle size={12} /> View Error
                      </button>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn-retry"
                        disabled={retryingId === row.id}
                        onClick={() => handleRetry(row.id)}
                        title="Retry pipeline steps for this user"
                      >
                        <RotateCw size={13} className={retryingId === row.id ? 'spinner' : ''} />
                        {retryingId === row.id ? 'Retrying...' : 'Retry'}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id, row.phone)}
                        style={{
                          background: '#fff1f2',
                          border: '1px solid #fecdd3',
                          color: '#e11d48',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                        }}
                        title={`Delete ${row.phone}`}
                      >
                        <Trash2 size={13} />
                        {deletingId === row.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {registrations.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No registrations found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> Integration Error Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedError(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '10px' }}>
              Failed step for user <strong>{selectedError.name}</strong>:
            </p>
            <pre
              style={{
                background: '#1e293b',
                color: '#f87171',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {selectedError.error}
            </pre>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button type="button" className="btn-secondary" onClick={() => setSelectedError(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Simulator Modal */}
      {showWebhookModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="glass-card" style={{ maxWidth: '540px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#4f46e5" /> AutoComm Webhook Simulator
              </h3>
              <button
                type="button"
                onClick={() => setShowWebhookModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '18px' }}>
              Simulate an incoming status webhook from AutoComm to <code>POST /api/webhooks/autocomm</code>.
            </p>

            <form onSubmit={handleSendWebhook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Registered Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+14155552671"
                  value={webhookPhone}
                  onChange={(e) => setWebhookPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Channel Type</label>
                  <select
                    className="form-input"
                    value={webhookType}
                    onChange={(e) => {
                      setWebhookType(e.target.value);
                      setWebhookStatus(e.target.value === 'message' ? 'delivered' : 'completed');
                    }}
                  >
                    <option value="message">WhatsApp Message</option>
                    <option value="call">Voice Call</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select
                    className="form-input"
                    value={webhookStatus}
                    onChange={(e) => setWebhookStatus(e.target.value)}
                  >
                    {webhookType === 'message' ? (
                      <>
                        <option value="sent">sent</option>
                        <option value="delivered">delivered</option>
                        <option value="read">read</option>
                        <option value="failed">failed</option>
                      </>
                    ) : (
                      <>
                        <option value="initiated">initiated</option>
                        <option value="completed">completed</option>
                        <option value="failed">failed</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Shared Secret Header (X-Webhook-Secret)</label>
                <input
                  type="password"
                  className="form-input"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  required
                />
              </div>

              {webhookResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: webhookResult.includes('success') ? '#ecfdf5' : '#fef2f2',
                    border: `1px solid ${webhookResult.includes('success') ? '#a7f3d0' : '#fecaca'}`,
                    color: webhookResult.includes('success') ? '#065f46' : '#991b1b',
                    fontSize: '0.85rem',
                  }}
                >
                  {webhookResult}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowWebhookModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Dispatch Webhook Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
