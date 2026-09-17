import React from 'react';
import { LayoutDashboard, Network, GitCommit, AlertTriangle, Microscope, ShieldCheck, Database, Scale, Sparkles } from 'lucide-react';
import { NavigationPage } from '../../types';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, federationRounds, incidents, selectedIncidentId } = useFedSentinelStore();

  const openIncidentsCount = incidents.filter(i => i.action_taken === 'QUARANTINED' || i.action_taken === 'FLAGGED_REVIEW').length;

  const tabs: Array<{ id: NavigationPage; label: string; icon: React.ElementType; badge?: string | number }> = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'clients', label: 'Federation Network', icon: Network },
    { id: 'model', label: 'Model Center', icon: Database },
    { id: 'threats', label: 'Security Center', icon: ShieldCheck },
    { 
      id: 'investigation', 
      label: 'Investigation', 
      icon: Microscope,
      badge: selectedIncidentId || undefined 
    },
    { 
      id: 'incidents', 
      label: 'Incidents', 
      icon: AlertTriangle,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined
    },
    { id: 'audit', label: 'Trust Center', icon: GitCommit },
    { id: 'compliance', label: 'Compliance & Legal', icon: Scale },
    { id: 'pitch', label: 'Platform Pitch', icon: Sparkles },
  ];

  return (
    <nav className="bg-slate-950 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 py-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-slate-900 border-brand-cyan/50 text-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold ${isActive ? 'bg-brand-cyan text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
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
