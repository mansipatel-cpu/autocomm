import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminAuthProvider, useSuperAdminAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/pages/LoginPage';
import { Layout } from './shared/components/layout/Layout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ClientsListPage } from './features/clients/pages/ClientsListPage';
import { ClientUsersPage } from './features/client-users/pages/ClientUsersPage';
import { EmailTemplatesPage } from './features/email-templates/pages/EmailTemplatesPage';
import { FlowBuilderPage } from './features/flow-builder/pages/FlowBuilderPage';
import { MonitoringPage } from './features/monitoring/pages/MonitoringPage';
import { PlatformReportsPage } from './features/reports/pages/PlatformReportsPage';
import { PhoneNumbersPage } from './features/phone-numbers/pages/PhoneNumbersPage';
import { IncomingConnectionsPage } from './features/incoming-connections/pages/IncomingConnectionsPage';

const PlaceholderSuperAdmin = ({ title, desc }) => (
  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 text-center space-y-2">
    <h2 className="text-xl font-bold text-white">{title}</h2>
    <p className="text-xs text-slate-400">{desc}</p>
  </div>
);

const ProtectedSuperAdminRoute = ({ children }) => {
  const { adminUser, loading } = useSuperAdminAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#070b14] text-white text-sm">
        Verifying Super Admin session...
      </div>
    );
  }
  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <SuperAdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedSuperAdminRoute>
                <Layout />
              </ProtectedSuperAdminRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="clients" element={<ClientsListPage />} />
            <Route path="client-users" element={<ClientUsersPage />} />
            <Route path="email-templates" element={<EmailTemplatesPage />} />
            <Route path="phone-numbers" element={<PhoneNumbersPage />} />
            <Route path="incoming-connections" element={<IncomingConnectionsPage />} />
            <Route path="flow-builder" element={<FlowBuilderPage />} />
            <Route path="monitoring/*" element={<MonitoringPage />} />
            <Route path="reports" element={<PlatformReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </SuperAdminAuthProvider>
  );
};

export default App;
