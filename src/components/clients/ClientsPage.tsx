import React, { useState, useMemo } from 'react';
import {
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  RotateCcw,
  ShieldAlert,
  ShieldX,
  Edit,
  Cpu,
  Activity,
  Zap,
  Lock,
} from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { HospitalClient } from '../../types';
import { AddClientModal } from './AddClientModal';
import { TrustGauge } from '../common/TrustGauge';

export const ClientsPage: React.FC = () => {
  const {
    hospitals,
    setHospitals,
    setActivePersona,
    setActiveHospitalId,
    addToast,
    settings,
  } = useFedSentinelStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cohortFilter, setCohortFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<HospitalClient | null>(null);

  // Filtered clients
  const filteredClients = useMemo(() => {
    return hospitals.filter((c) => {
      const matchesSearch =
        c.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.enclave_type && c.enclave_type.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesCohort = cohortFilter === 'ALL' || c.disease_cohort === cohortFilter;

      return matchesSearch && matchesStatus && matchesCohort;
    });
  }, [hospitals, searchQuery, statusFilter, cohortFilter]);

  const handleStatusOverride = async (clientId: string, action: 'REINSTATE' | 'QUARANTINE' | 'BLOCK') => {
    try {
      const res = await fetch(`${settings.apiBaseUrl}/clients/${clientId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        const data = await res.json();
        setHospitals(hospitals.map(h => h.client_id === clientId ? (data.client || data) : h));
        addToast({
          type: 'info',
          title: `Action: ${action}`,
          message: `Node ${clientId} updated successfully.`,
        });
      }
    } catch (e) {
      // Local fallback
      const updated = hospitals.map(h => {
        if (h.client_id === clientId) {
          if (action === 'REINSTATE') return { ...h, status: 'TRUSTED', trust_score: Math.max(85, h.trust_score) };
          if (action === 'QUARANTINE') return { ...h, status: 'QUARANTINED', trust_score: 35 };
          if (action === 'BLOCK') return { ...h, status: 'BLOCKED', trust_score: 10 };
        }
        return h;
      });
      setHospitals(updated);
      addToast({ type: 'info', title: `Action: ${action} (Local)`, message: `Node ${clientId} updated.` });
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      const res = await fetch(`${settings.apiBaseUrl}/clients/${editingClient.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient),
      });

      if (res.ok) {
        const data = await res.json();
        setHospitals(hospitals.map(h => h.client_id === editingClient.client_id ? (data.client || data) : h));
        addToast({
          type: 'success',
          title: 'Parameters Updated',
          message: `${editingClient.name} parameters synchronized across network.`,
        });
        setEditingClient(null);
      }
    } catch (err) {
      setHospitals(hospitals.map(h => h.client_id === editingClient.client_id ? editingClient : h));
      addToast({
        type: 'success',
        title: 'Updated Locally',
        message: `${editingClient.name} updated in local store.`,
      });
      setEditingClient(null);
    }
  };

  const openWorkstationFor = (clientId: string) => {
    setActiveHospitalId(clientId);
    setActivePersona('HOSPITAL');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header Banner */}
      <div className="glass-panel rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-brand-cyan/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100">
                Federation Enclave Network Registry
              </h1>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-cyan-950/60 text-brand-cyan border border-brand-cyan/40">
                {hospitals.length} NODES CONNECTED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage distributed clinical hospital enclaves, disease cohort specializations, and real-time trust posture.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(0,240,255,0.25)]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Hospital Node</span>
        </button>
      </div>

      {/* Cohort & Status Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-code uppercase text-slate-400 block">Total Clinical Enclaves</span>
            <span className="text-xl font-bold font-mono-code text-slate-100">{hospitals.length}</span>
          </div>
          <Building2 className="w-6 h-6 text-slate-500" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-code uppercase text-emerald-400 block">Trusted Active Nodes</span>
            <span className="text-xl font-bold font-mono-code text-emerald-400">
              {hospitals.filter(h => h.status === 'TRUSTED').length}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500/50" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-code uppercase text-cyan-400 block">Pulmonology Cohorts</span>
            <span className="text-xl font-bold font-mono-code text-cyan-300">
              {hospitals.filter(h => (h.disease_cohort || 'PNEUMONIA') === 'PNEUMONIA').length}
            </span>
          </div>
          <span className="text-xl">🫁</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono-code uppercase text-indigo-400 block">Neuro-Oncology Cohorts</span>
            <span className="text-xl font-bold font-mono-code text-indigo-300">
              {hospitals.filter(h => h.disease_cohort === 'GLIOBLASTOMA').length}
            </span>
          </div>
          <span className="text-xl">🧠</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, hospital name, department, or enclave..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={cohortFilter}
            onChange={(e) => setCohortFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono-code rounded-md bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-cyan"
          >
            <option value="ALL">All Disease Cohorts</option>
            <option value="PNEUMONIA">Pulmonology (Pneumonia)</option>
            <option value="GLIOBLASTOMA">Neuro-Oncology (Glioblastoma)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono-code rounded-md bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-brand-cyan"
          >
            <option value="ALL">All Statuses</option>
            <option value="TRUSTED">Trusted</option>
            <option value="REVIEW">Review</option>
            <option value="QUARANTINED">Quarantined</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Hospital Nodes Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono-code text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Node / Hospital</th>
                <th className="py-3 px-4">Disease Cohort</th>
                <th className="py-3 px-4">Enclave Hardware (TEE)</th>
                <th className="py-3 px-4 text-center">Dataset</th>
                <th className="py-3 px-4 text-center">Trust Posture</th>
                <th className="py-3 px-4 text-center">Security Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-code">
              {filteredClients.map((client) => {
                const isQuarantined = client.status === 'QUARANTINED';
                const isBlocked = client.status === 'BLOCKED';
                const isGlio = client.disease_cohort === 'GLIOBLASTOMA';

                return (
                  <tr key={client.client_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-slate-200">
                          {client.client_id}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{client.name}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{client.department}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        isGlio
                          ? 'bg-indigo-950/50 text-indigo-300 border-indigo-800'
                          : 'bg-cyan-950/50 text-cyan-300 border-cyan-800'
                      }`}>
                        <span>{isGlio ? '🧠' : '🫁'}</span>
                        <span>{isGlio ? 'Glioblastoma MRI' : 'Pneumonia X-Ray'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px]">{client.enclave_type || 'Intel SGX Enclave'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="text-slate-200 font-bold">{client.samples_count}</span>
                      <span className="text-[10px] text-slate-500 ml-1">scans</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-bold ${
                          client.trust_score >= 80 ? 'text-emerald-400' : client.trust_score >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {client.trust_score}%
                        </span>
                        <div className="w-16 bg-slate-950 rounded-full h-1.5 overflow-hidden mt-1 border border-slate-800">
                          <div
                            className={`h-full ${
                              client.trust_score >= 80 ? 'bg-emerald-500' : client.trust_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${client.trust_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                        client.status === 'TRUSTED'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : client.status === 'REVIEW'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : client.status === 'QUARANTINED'
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : 'bg-red-950 text-rose-300 border-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          client.status === 'TRUSTED' ? 'bg-emerald-400' : client.status === 'REVIEW' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        {client.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-sans">
                        <button
                          onClick={() => setEditingClient(client)}
                          title="Edit Node Parameters"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => openWorkstationFor(client.client_id)}
                          title="Open in Local AI Workstation"
                          className="px-2.5 py-1 rounded bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/40 text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Train Enclave</span>
                        </button>

                        {isQuarantined ? (
                          <button
                            onClick={() => handleStatusOverride(client.client_id, 'REINSTATE')}
                            title="Reinstate Node"
                            className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900 text-[10px] font-bold transition-colors"
                          >
                            Reinstate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusOverride(client.client_id, 'QUARANTINE')}
                            title="Quarantine Node"
                            className="px-2 py-1 rounded bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900 text-[10px] font-bold transition-colors"
                          >
                            Quarantine
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Node Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-800 overflow-hidden text-slate-200">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-brand-cyan" />
                Edit Enclave Parameters — {editingClient.client_id}
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Institution Name</label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  value={editingClient.department || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, department: e.target.value })}
                  className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Disease Cohort</label>
                  <select
                    value={editingClient.disease_cohort || 'PNEUMONIA'}
                    onChange={(e) => setEditingClient({ ...editingClient, disease_cohort: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono-code"
                  >
                    <option value="PNEUMONIA">Pneumonia (Chest X-Ray)</option>
                    <option value="GLIOBLASTOMA">Glioblastoma (Brain MRI)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Clinical Samples</label>
                  <input
                    type="number"
                    value={editingClient.samples_count}
                    onChange={(e) => setEditingClient({ ...editingClient, samples_count: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono-code"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Status</label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono-code"
                  >
                    <option value="TRUSTED">TRUSTED</option>
                    <option value="REVIEW">REVIEW</option>
                    <option value="QUARANTINED">QUARANTINED</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Trust Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingClient.trust_score}
                    onChange={(e) => setEditingClient({ ...editingClient, trust_score: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono-code"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-brand-cyan text-slate-950 font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
