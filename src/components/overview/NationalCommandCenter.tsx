import React, { useState, useMemo } from 'react';
import { Globe, Building2, ShieldAlert, ShieldCheck, AlertTriangle, Filter, Layers, MapPin, Search } from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';

interface NationalFacility {
  client_id: string;
  name: string;
  hfr_reference_id: string;
  state: string;
  district: string;
  status: 'ACTIVE' | 'SUSPICIOUS' | 'QUARANTINED' | string;
  trust_score: number;
  anomaly_score: number;
  samples_count: number;
  enclave_type: string;
  department: string;
  latitude: number;
  longitude: number;
}

export const NationalCommandCenter: React.FC = () => {
  const { hospitals, setSelectedClientId, setActiveTab } = useFedSentinelStore();
  const [fleetSize, setFleetSize] = useState<number>(50);
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generated synthetic national fleet based on selected size
  const nationalFleet = useMemo(() => {
    // If fleetSize is 5, use the actual 5 default hospitals from store
    if (fleetSize === 5 && hospitals.length > 0) {
      return hospitals.map(h => ({
        client_id: h.client_id,
        name: h.name,
        hfr_reference_id: `IN-HFR-${h.client_id}9821`,
        state: h.client_id === 'H1' ? 'Delhi NCR' : h.client_id === 'H2' ? 'Maharashtra' : h.client_id === 'H3' ? 'Karnataka' : h.client_id === 'H4' ? 'Tamil Nadu' : 'Telangana',
        district: 'Metropolitan',
        status: h.status,
        trust_score: h.trust_score,
        anomaly_score: h.anomaly_score || 0.05,
        samples_count: h.samples_count,
        enclave_type: h.enclave_type || 'Intel SGX Enclave',
        department: h.department || 'Radiology',
        latitude: 20.5937,
        longitude: 78.9629,
      }));
    }

    // Deterministic synthetic fleet generator
    const states = ['Maharashtra', 'Karnataka', 'Delhi NCR', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'];
    const prefixes = ['Apollo', 'Fortis', 'Max Super Specialty', 'Manipal', 'Narayana Health', 'AIMS Regional', 'St. John\'s', 'KIMS'];
    
    return Array.from({ length: fleetSize }).map((_, i) => {
      const id = `H${(i + 1).toString().padStart(3, '0')}`;
      const state = states[i % states.length];
      const prefix = prefixes[i % prefixes.length];
      const isQuarantined = i === 2 || (i % 17 === 0 && i > 0);
      const isSuspicious = i % 7 === 0 && !isQuarantined;

      return {
        client_id: id,
        name: `${prefix} Hospital - ${state}`,
        hfr_reference_id: `IN-HFR-${9820000 + i}`,
        state: state,
        district: `District ${ (i % 5) + 1}`,
        status: isQuarantined ? 'QUARANTINED' : isSuspicious ? 'SUSPICIOUS' : 'ACTIVE',
        trust_score: isQuarantined ? 28.0 : isSuspicious ? 58.5 : 95.0 - (i % 5),
        anomaly_score: isQuarantined ? 0.88 : isSuspicious ? 0.42 : 0.05,
        samples_count: 850 + (i * 15) % 2400,
        enclave_type: i % 2 === 0 ? 'Intel SGX Enclave' : 'AMD SEV-SNP',
        department: 'Diagnostic Imaging & Oncology',
        latitude: 12.0 + (i * 1.5) % 16,
        longitude: 73.0 + (i * 1.2) % 15,
      };
    });
  }, [fleetSize, hospitals]);

  // Filtered fleet
  const filteredFleet = useMemo(() => {
    return nationalFleet.filter(item => {
      const matchesState = selectedState === 'ALL' || item.state === selectedState;
      const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hfr_reference_id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesState && matchesStatus && matchesSearch;
    });
  }, [nationalFleet, selectedState, selectedStatus, searchQuery]);

  // Stats
  const activeCount = nationalFleet.filter(f => f.status === 'ACTIVE').length;
  const suspiciousCount = nationalFleet.filter(f => f.status === 'SUSPICIOUS').length;
  const quarantinedCount = nationalFleet.filter(f => f.status === 'QUARANTINED').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center text-brand-cyan">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">National Healthcare AI Command Center</h2>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800 font-bold">
                SIMULATED / DEMO FLEET
              </span>
            </div>
            <p className="text-xs text-slate-400">Pan-India federated hospital network security telemetry & node clustering</p>
          </div>
        </div>

        {/* Fleet Size Selector Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs font-mono-code">
          <span className="text-slate-400 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Fleet Size:
          </span>
          {[5, 50, 100, 500].map(sz => (
            <button
              key={sz}
              onClick={() => setFleetSize(sz)}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                fleetSize === sz
                  ? 'bg-brand-cyan text-slate-950 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {sz} Nodes
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards & Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono-code text-slate-400">Total Facilities</span>
          <span className="text-base font-bold text-slate-100 font-mono-code">{nationalFleet.length}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/50 flex items-center justify-between">
          <span className="text-xs font-mono-code text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Active Quorum
          </span>
          <span className="text-base font-bold text-emerald-400 font-mono-code">{activeCount}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-amber-900/50 flex items-center justify-between">
          <span className="text-xs font-mono-code text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Suspicious
          </span>
          <span className="text-base font-bold text-amber-400 font-mono-code">{suspiciousCount}</span>
        </div>
        <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/50 flex items-center justify-between">
          <span className="text-xs font-mono-code text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Quarantined
          </span>
          <span className="text-base font-bold text-rose-400 font-mono-code">{quarantinedCount}</span>
        </div>
      </div>

      {/* Search & State Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, HFR ID (IN-HFR-...), or node ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-cyan font-mono-code"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none font-mono-code"
          >
            <option value="ALL">All Indian States</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Gujarat">Gujarat</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none font-mono-code"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE Only</option>
            <option value="SUSPICIOUS">SUSPICIOUS Only</option>
            <option value="QUARANTINED">QUARANTINED Only</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredFleet.map((fac) => {
          const isQuarantined = fac.status === 'QUARANTINED';
          const isSuspicious = fac.status === 'SUSPICIOUS';

          return (
            <div
              key={fac.client_id}
              onClick={() => {
                setSelectedClientId(fac.client_id);
                setActiveTab('investigation');
              }}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                isQuarantined
                  ? 'bg-rose-950/20 border-rose-800/80 hover:border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                  : isSuspicious
                  ? 'bg-amber-950/20 border-amber-800/80 hover:border-amber-500'
                  : 'bg-slate-950 border-slate-800 hover:border-brand-cyan/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono-code font-bold text-brand-cyan">{fac.client_id}</span>
                  <span className={`text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded border ${
                    isQuarantined
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : isSuspicious
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    {fac.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 truncate">{fac.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-mono-code">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{fac.state} ({fac.district})</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono-code">
                <span className="text-slate-400">{fac.hfr_reference_id}</span>
                <span className={`font-bold ${isQuarantined ? 'text-rose-400' : 'text-emerald-400'}`}>
                  Trust: {fac.trust_score}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
