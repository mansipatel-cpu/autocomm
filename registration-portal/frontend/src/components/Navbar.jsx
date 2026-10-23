import { UserPlus, ShieldCheck, Zap } from 'lucide-react';

export function Navbar({ activePage, setActivePage, isMockMode }) {
  return (
    <header className="navbar">
      <div className="nav-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="brand">
            <div className="brand-icon">
              <Zap size={20} />
            </div>
            <span>AutoComm <span style={{ fontWeight: 400, color: '#6366f1' }}>Portal</span></span>
          </div>

          <div className={`mode-pill ${isMockMode ? 'mode-mock' : 'mode-live'}`}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isMockMode ? '#d97706' : '#16a34a' }} />
            <span>{isMockMode ? 'MOCK MODE' : 'LIVE AUTOCOMM'}</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            type="button"
            className={`nav-tab ${activePage === 'register' ? 'active' : ''}`}
            onClick={() => setActivePage('register')}
          >
            <UserPlus size={16} />
            <span>Registration</span>
          </button>

          <button
            type="button"
            className={`nav-tab ${activePage === 'admin' ? 'active' : ''}`}
            onClick={() => setActivePage('admin')}
          >
            <ShieldCheck size={16} />
            <span>Admin Status</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
