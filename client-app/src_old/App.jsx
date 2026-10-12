import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/pages/LoginPage';
import { Layout } from './shared/components/layout/Layout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { ContactsPage } from './features/contacts/pages/ContactsPage';
import { TemplatesPage } from './features/templates/pages/TemplatesPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { CampaignsPage } from './features/campaigns/pages/CampaignsPage';
import { TeamInboxPage } from './features/team-inbox/pages/TeamInboxPage';
import { KnowledgeBasePage } from './features/knowledge-base/pages/KnowledgeBasePage';
import { AgentsPage } from './features/agents/pages/AgentsPage';
import { VoiceLibraryPage } from './features/voice-library/pages/VoiceLibraryPage';
import { PhoneNumbersPage } from './features/phone-numbers/pages/PhoneNumbersPage';
import { CallsPage } from './features/calls/pages/CallsPage';
import { QuickCrmPage } from './features/crm/pages/QuickCrmPage';
import { ApiDocsPage } from './features/api-docs/pages/ApiDocsPage';
import { AnalyticsPage } from './features/analytics/pages/AnalyticsPage';

// Placeholder views for remaining modules (to be implemented in later phases)
const PlaceholderModule = ({ title, desc }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
    <p className="text-xs text-slate-500">{desc}</p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Loading AutoComm console...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="team-inbox" element={<TeamInboxPage />} />
            <Route path="inbox" element={<TeamInboxPage />} />
            <Route path="message/inbox" element={<TeamInboxPage />} />
            <Route path="api-docs" element={<ApiDocsPage />} />
            <Route path="api-keys" element={<ApiDocsPage />} />
            <Route path="message/api-docs" element={<ApiDocsPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="voice-library" element={<VoiceLibraryPage />} />
            <Route path="voices" element={<VoiceLibraryPage />} />
            <Route path="calls" element={<CallsPage />} />
            <Route path="quick-crm" element={<QuickCrmPage />} />
            <Route path="crm" element={<QuickCrmPage />} />
            <Route path="phone-numbers" element={<PhoneNumbersPage />} />
            <Route path="incoming-connections" element={<PhoneNumbersPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
