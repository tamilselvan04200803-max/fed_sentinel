import React from 'react';
import {
  LayoutDashboard,
  Building2,
  GitCommit,
  AlertTriangle,
  Microscope,
} from 'lucide-react';
import { NavigationPage } from '../../types';
import { useFedSentinel } from '../../context/FedSentinelContext';

export const NavigationTabs: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    clients,
    rounds,
    incidents,
    selectedIncidentId,
  } = useFedSentinel();

  const quarantinedCount = clients.filter((c) => c.status === 'QUARANTINED').length;
  const reviewCount = clients.filter((c) => c.status === 'REVIEW').length;
  const openIncidentsCount = incidents.filter(
    (i) => i.action_taken === 'QUARANTINED' || i.action_taken === 'FLAGGED_REVIEW'
  ).length;

  const tabs: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    {
      id: 'overview',
      label: 'Security Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'clients',
      label: 'Hospital Clients',
      icon: Building2,
      badge: clients.length,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'rounds',
      label: 'Federation Rounds',
      icon: GitCommit,
      badge: rounds.length > 0 ? `R${rounds[0]?.round_id}` : undefined,
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      id: 'incidents',
      label: 'Incidents & Blast Radius',
      icon: AlertTriangle,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200',
    },
    {
      id: 'investigation',
      label: 'Layer 0-5 Investigation',
      icon: Microscope,
      badge: selectedIncidentId || undefined,
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono-code',
    },
  ];

  return (
    <nav aria-label="Dashboard views" className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                type="button"
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold ${
                      isActive ? 'bg-slate-800 text-slate-200' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
