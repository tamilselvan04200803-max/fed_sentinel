import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Building2,
  GitCommit,
  Activity,
  AlertTriangle,
  Microscope,
  Network,
  Radio,
} from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { KPICard } from '../common/KPICard';
import { LoadingState } from '../common/StateViews';
import { PipelineVisualization } from './PipelineVisualization';
import { ClusterGraph } from './ClusterGraph';
import { NationalCommandCenter } from './NationalCommandCenter';

export const SecurityOverview: React.FC = () => {
  const {
    hospitals,
    federationRounds,
    incidents,
    events,
    systemStatus,
    setActiveTab,
  } = useFedSentinelStore();

  const [filterEventType, setFilterEventType] = useState<string>('ALL');

  // Computed Metrics
  const activeHospitalsCount = hospitals.length;
  const quarantinedCount = hospitals.filter(c => c.status === 'QUARANTINED').length;
  const globalAccuracy = federationRounds[0]?.global_accuracy ?? 0;
  
  const openIncidents = incidents.filter(
    i => i.action_taken === 'QUARANTINED' || i.action_taken === 'FLAGGED_REVIEW'
  ).length;

  const threatLevel = openIncidents > 0 ? 'ELEVATED' : 'NOMINAL';

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (filterEventType === 'ALL') return events;
    return events.filter((e) => e.event_type === filterEventType);
  }, [events, filterEventType]);

  const eventTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.event_type));
    return ['ALL', ...Array.from(set)];
  }, [events]);

  // Mock PCA Data for Scatter Plot
  const pcaData = useMemo(() => {
    // Generate cluster of normal updates
    const normal = Array.from({ length: 40 }).map((_, i) => ({
      x: (Math.random() * 4 - 2).toFixed(2),
      y: (Math.random() * 4 - 2).toFixed(2),
      z: 1, // Size
      type: 'normal',
      client: `H${(i % 4) + 1}`,
    }));
    
    // Anomalous updates (H3 or whatever is quarantined)
    const anomalous = incidents.map((inc, i) => ({
      x: (4 + Math.random() * 3).toFixed(2),
      y: (4 + Math.random() * 3).toFixed(2),
      z: 2, // Larger point
      type: 'anomalous',
      client: inc.client_id,
      incident: inc.incident_id
    }));

    return [...normal, ...anomalous];
  }, [incidents]);

  if (activeHospitalsCount === 0 && systemStatus.apiStatus === 'offline') {
    return <LoadingState message="Connecting to FedSentinel-Health Security Gateway..." />;
  }

  return (
    <div className="space-y-6">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Federation"
          icon={<Building2 className="w-4 h-4 text-brand-cyan" />}
          value={activeHospitalsCount}
          subValue="Nodes Connected"
          subtitleLeft="Enclave Network"
          subtitleRight={<span className="text-emerald-400">100% Online</span>}
          onClick={() => setActiveTab('clients')}
        />
        <KPICard
          title="Global Model Acc"
          icon={<ShieldCheck className="w-4 h-4 text-emerald-400" />}
          value={`${globalAccuracy}%`}
          subValue="Post-Defense"
          subtitleLeft={`Round ${federationRounds[0]?.round_id ?? 0}`}
          subtitleRight={<span className="text-emerald-400">+0.2%</span>}
          onClick={() => setActiveTab('model')}
        />
        <KPICard
          title="Threat Level"
          icon={<ShieldAlert className={`w-4 h-4 ${threatLevel === 'ELEVATED' ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />}
          value={threatLevel}
          subValue={`${openIncidents} Active`}
          subtitleLeft="Zero-Trust Pipeline"
          subtitleRight={<span className={threatLevel === 'ELEVATED' ? 'text-amber-500' : 'text-emerald-500'}>Armed</span>}
          onClick={() => setActiveTab('threats')}
          isActive={threatLevel === 'ELEVATED'}
        />
        <KPICard
          title="Quarantined Nodes"
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          value={quarantinedCount}
          subValue="Isolated"
          subtitleLeft="Incident Response"
          subtitleRight={<span className="text-slate-400">View Logs</span>}
          onClick={() => setActiveTab('incidents')}
          isActive={quarantinedCount > 0}
        />
      </div>

      {/* National Command Center */}
      <NationalCommandCenter />

      {/* Flagship Element 1: Security Pipeline Live Visualizer */}
      <PipelineVisualization />

      {/* Flagship Element 2: Cluster Graph */}
      <ClusterGraph />

      {/* Main Grid: Network Graph & PCA Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Federation Network Topology */}
        <div className="glass-panel rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-brand-cyan" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Federation Topology
              </h3>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] relative flex items-center justify-center bg-slate-950/50 rounded border border-slate-800/50 overflow-hidden">
            {/* SVG Network Map */}
            <svg width="100%" height="100%" viewBox="0 0 500 300" className="absolute inset-0">
              {/* Center Gateway */}
              <circle cx="250" cy="150" r="35" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" className="shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
              <text x="250" y="155" textAnchor="middle" fill="#00f0ff" fontSize="10" fontFamily="monospace" fontWeight="bold">GATEWAY</text>
              
              {/* Nodes and Links */}
              {hospitals.map((hospital, index) => {
                const total = hospitals.length || 5;
                const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
                const radius = 100;
                const cx = 250 + Math.cos(angle) * radius;
                const cy = 150 + Math.sin(angle) * radius;
                
                const isQuarantined = hospital.status === 'QUARANTINED';
                const color = isQuarantined ? '#f43f5e' : '#10b981'; // rose-500 or emerald-500
                const strokeDasharray = isQuarantined ? "4 4" : "0";

                return (
                  <g key={hospital.client_id}>
                    {/* Line to center */}
                    <line x1={cx} y1={cy} x2="250" y2="150" stroke={color} strokeWidth="1.5" strokeDasharray={strokeDasharray} opacity="0.6" />
                    {/* Node circle */}
                    <circle cx={cx} cy={cy} r="18" fill="#1e293b" stroke={color} strokeWidth="2" />
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="bold">{hospital.client_id}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* PCA Update Space */}
        <div className="glass-panel rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-brand-blue" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Update Space Projection (PCA)
              </h3>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] bg-slate-950/50 rounded border border-slate-800/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <XAxis type="number" dataKey="x" name="PC1" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="PC2" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
                <ZAxis type="number" dataKey="z" range={[20, 80]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px', color: '#f8fafc', fontFamily: 'monospace' }}
                  itemStyle={{ color: '#00f0ff' }}
                />
                {/* Normal cluster */}
                <Scatter name="Trusted Updates" data={pcaData.filter(d => d.type === 'normal')} fill="#10b981" fillOpacity={0.6} />
                {/* Anomalous cluster */}
                <Scatter name="Anomalous Updates" data={pcaData.filter(d => d.type === 'anomalous')} fill="#f43f5e" fillOpacity={0.8} shape="cross" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Live Event Feed */}
      <div className="glass-panel rounded-lg p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Security Telemetry Stream
            </h3>
          </div>
          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="text-[11px] font-mono-code bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-cyan"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredEvents.length > 0 ? (
            filteredEvents.slice(0, 50).map((evt, idx) => {
              const isAlert = evt.event_type.includes('QUARANTINE') || evt.event_type.includes('INCIDENT');
              return (
                <div
                  key={`${evt.timestamp}-${idx}`}
                  className={`p-3 rounded border text-xs flex flex-col gap-1.5 transition-all font-mono-code ${
                    isAlert
                      ? 'bg-rose-950/30 border-rose-900 text-rose-200'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isAlert ? 'bg-rose-900 text-rose-300' : 'bg-slate-800 text-brand-cyan'
                        }`}
                      >
                        {evt.event_type}
                      </span>
                      <span className="font-bold text-slate-100">
                        {evt.client_id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Payload Keys/Values */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px]">
                    {Object.entries(evt.payload || {}).map(([k, v]) => (
                      <span key={k}>
                        <span className="text-slate-500">{k}:</span>{' '}
                        <span className="text-slate-200">{String(v)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-slate-500 font-mono-code flex flex-col items-center gap-2">
              <Radio className="w-5 h-5 opacity-50" />
              <span>Awaiting telemetry packets...</span>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};
