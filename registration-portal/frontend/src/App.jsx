import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { RegistrationForm } from './components/RegistrationForm.jsx';
import { SuccessCard } from './components/SuccessCard.jsx';
import { AdminLoginModal } from './components/AdminLoginModal.jsx';
import { AdminDashboard } from './components/AdminDashboard.jsx';
import { api } from './services/api.js';

export default function App() {
  const [activePage, setActivePage] = useState('register');
  const [registeredData, setRegisteredData] = useState(null);
  const [adminToken, setAdminToken] = useState(() => {
    return sessionStorage.getItem('autocomm_admin_token') || '';
  });
  const [isMockMode, setIsMockMode] = useState(true);

  useEffect(() => {
    async function checkBackend() {
      const health = await api.checkHealth();
      if (health.success && typeof health.isMockAutoComm === 'boolean') {
        setIsMockMode(health.isMockAutoComm);
      }
    }
    checkBackend();
  }, []);

  const handleLoginSuccess = (token) => {
    setAdminToken(token);
    sessionStorage.setItem('autocomm_admin_token', token);
  };

  const handleLogout = () => {
    setAdminToken('');
    sessionStorage.removeItem('autocomm_admin_token');
  };

  return (
    <div className="app-container">
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page === 'register') {
            // Keep existing form state or reset if needed
          }
        }}
        isMockMode={isMockMode}
      />

      <main className="main-wrapper">
        {activePage === 'register' && (
          <>
            {registeredData ? (
              <SuccessCard
                data={registeredData}
                onReset={() => setRegisteredData(null)}
                onGoToAdmin={() => setActivePage('admin')}
              />
            ) : (
              <RegistrationForm
                onSuccess={(data) => setRegisteredData(data)}
              />
            )}
          </>
        )}

        {activePage === 'admin' && (
          <>
            {adminToken ? (
              <AdminDashboard
                token={adminToken}
                onLogout={handleLogout}
              />
            ) : (
              <AdminLoginModal
                onLoginSuccess={handleLoginSuccess}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
