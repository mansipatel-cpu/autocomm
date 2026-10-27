import { CheckCircle2, MessageSquare, PhoneCall, ArrowRight, UserPlus } from 'lucide-react';

export function SuccessCard({ data, onReset, onGoToAdmin }) {
  return (
    <div className="glass-card success-screen" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="success-badge-icon">
        <CheckCircle2 size={42} strokeWidth={2.5} />
      </div>

      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Registration Confirmed!
        </h2>
        <p style={{ fontSize: '1.05rem', color: '#475569', marginTop: '10px', lineHeight: 1.5, fontWeight: 500 }}>
          You&apos;re registered! Your contact details have been synced to AutoComm.
        </p>
      </div>

      <div
        style={{
          width: '100%',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Name</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>{data.fullName}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Registered Phone</span>
          <span style={{ fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{data.phone}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: 600, fontSize: '0.85rem' }}>
              <MessageSquare size={16} /> WhatsApp
            </div>
            <p style={{ fontSize: '0.75rem', color: '#047857', marginTop: '4px' }}>
              Added to AutoComm Campaign List
            </p>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1e40af', fontWeight: 600, fontSize: '0.85rem' }}>
              <PhoneCall size={16} /> AI Voice Call
            </div>
            <p style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: '4px' }}>
              Ready for AutoComm Calling Campaign
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '10px' }}>
        <button
          type="button"
          onClick={onReset}
          className="btn-secondary"
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
        >
          <UserPlus size={16} /> Register Another User
        </button>

        <button
          type="button"
          onClick={onGoToAdmin}
          className="btn-primary"
          style={{ flex: 1, padding: '12px' }}
        >
          View Admin Status <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
