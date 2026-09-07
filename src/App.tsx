import React from 'react';
import { FedSentinelProvider, useFedSentinel } from './context/FedSentinelContext';
import { Header } from './components/common/Header';
import { ConnectionBanner } from './components/common/ConnectionBanner';
import { NavigationTabs } from './components/common/NavigationTabs';
import { SecurityOverview } from './components/overview/SecurityOverview';
import { ClientsPage } from './components/clients/ClientsPage';
import { RoundsPage } from './components/rounds/RoundsPage';
import { IncidentsPage } from './components/incidents/IncidentsPage';
import { InvestigationPage } from './components/investigation/InvestigationPage';
import { StartRoundModal } from './components/common/StartRoundModal';
import { SimulationModal } from './components/common/SimulationModal';
import { ClientDetailModal } from './components/common/ClientDetailModal';
import { AuthModal } from './components/auth/AuthModal';
import { AddClientModal } from './components/clients/AddClientModal';
import { ToastContainer } from './components/common/ToastContainer';

const AppContent: React.FC = () => {
  const { activeTab } = useFedSentinel();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Console Header with Status, Backend URL config, and Actions */}
      <Header />

      {/* Connection & Live / Mock Indicator Banner */}
      <ConnectionBanner />

      {/* Operational Navigation Tabs */}
      <NavigationTabs />

      {/* Main Page View Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'overview' && <SecurityOverview />}
        {activeTab === 'clients' && <ClientsPage />}
        {activeTab === 'rounds' && <RoundsPage />}
        {activeTab === 'incidents' && <IncidentsPage />}
        {activeTab === 'investigation' && <InvestigationPage />}
      </main>

      {/* Global Context Modals & Notifications */}
      <StartRoundModal />
      <SimulationModal />
      <ClientDetailModal />
      <AuthModal />
      <AddClientModal />
      <ToastContainer />

      {/* Footer Audit Bar */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 sm:px-8 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono-code font-bold text-slate-700">FedSentinel v2.4.0-prod</span>
          <span className="text-slate-300">&bull;</span>
          <span>Zero-Trust Federated Intelligence Control Plane</span>
        </div>
        <div className="font-mono-code text-slate-600">
          &ldquo;DON&apos;T TRUST THE UPDATE. VERIFY IT.&rdquo;
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <FedSentinelProvider>
      <AppContent />
    </FedSentinelProvider>
  );
}

export default App;
