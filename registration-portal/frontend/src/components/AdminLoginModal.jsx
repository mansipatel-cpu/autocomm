import { useState } from 'react';
import { api } from '../services/api.js';
import { Lock, Key, AlertCircle, Loader2 } from 'lucide-react';

export function AdminLoginModal({ onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the administrator password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.adminLogin(password);
      if (res.success) {
        onLoginSuccess(res.data.token);
      } else {
        setError(res.error || 'Invalid administrator password.');
      }
    } catch (err) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '440px', margin: '40px auto', padding: '36px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: '#eef2ff',
            color: '#4f46e5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
          }}
        >
          <Lock size={26} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>Admin Authentication</h2>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '6px' }}>
          Enter the <code style={{ color: '#4f46e5' }}>ADMIN_PASSWORD</code> to view live registration logs and trigger pipeline retries.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="adminPass">
            <Key size={15} color="#6366f1" /> Admin Password
          </label>
          <input
            id="adminPass"
            type="password"
            className="form-input"
            placeholder="Enter ADMIN_PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Access Admin Status</span>
          )}
        </button>
      </form>
    </div>
  );
}
