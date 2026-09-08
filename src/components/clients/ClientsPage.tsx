import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Building2,
  AlertTriangle,
  CheckCircle2,
  History,
  Shield,
  Layers,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  RotateCcw,
  ShieldAlert,
  ShieldX,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { HospitalClient } from '../../types';

type SortField = 'trust_score' | 'status' | 'historical_anomalies' | 'last_active_round' | 'client_id' | 'samples_count';
type SortOrder = 'asc' | 'desc';

export const ClientsPage: React.FC = () => {
  const {
    clients,
    setSelectedClientId,
    isLoading,
    setAddClientModalOpen,
    overrideClientStatus,
    deleteHospitalClient,
    resetHospitalClients,
    currentUser,
  } = useFedSentinel();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('trust_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [actionMenuClientId, setActionMenuClientId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    return clients
      .filter((c) => {
        const matchesSearch =
          c.client_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.enclave_type && c.enclave_type.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [clients, searchQuery, statusFilter, sortField, sortOrder]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'TRUSTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            TRUSTED
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            REVIEW
          </span>
        );
      case 'QUARANTINED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            QUARANTINED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-red-950 text-rose-200 border border-rose-900">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            BLOCKED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono-code font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleOverride = async (e: React.MouseEvent, clientId: string, action: 'REINSTATE' | 'QUARANTINE' | 'BLOCK') => {
    e.stopPropagation();
    setActionMenuClientId(null);
    await overrideClientStatus(clientId, action);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Hospital Clients Registry &amp; Enclave Nodes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Distributed clinical enclave nodes participating in zero-trust federated model training.
          </p>
        </div>

        {/* Action Button & Status Counts Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono-code text-[11px]">
              {clients.filter((c) => c.status === 'TRUSTED').length} Trusted
            </span>
            <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold font-mono-code text-[11px]">
              {clients.filter((c) => c.status === 'QUARANTINED').length} Quarantined
            </span>
          </div>

          <button
            onClick={() => resetHospitalClients(false)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Reset registry back to original default demo hospitals"
            type="button"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Clear all hospital nodes so you can register your own custom hospitals?')) {
                resetHospitalClients(true);
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 transition-colors shadow-2xs"
            title="Clear all predefined nodes so you can test with custom hospitals only"
            type="button"
          >
            <Trash2 className="w-3 h-3 text-rose-500" />
            <span>Clear All</span>
          </button>

          <button
            onClick={() => setAddClientModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-xs"
            type="button"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Register Hospital Node</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Node ID (e.g. H3), hospital, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Filter:</span>
          </div>

          <div className="flex items-center gap-1">
            {['ALL', 'TRUSTED', 'REVIEW', 'QUARANTINED', 'BLOCKED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Clients Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th
                  onClick={() => handleSort('client_id')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Node ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Hospital / Enclave Details</th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('trust_score')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Trust Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('samples_count')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Dataset Samples</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('historical_anomalies')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Anomalies</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('last_active_round')}
                  className="px-4 py-3 cursor-pointer hover:text-slate-900"
                >
                  <div className="flex items-center gap-1">
                    <span>Last Active</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3 text-right">SecOps Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAndSortedClients.length > 0 ? (
                filteredAndSortedClients.map((client) => {
                  return (
                    <tr
                      key={client.client_id}
                      onClick={() => setSelectedClientId(client.client_id)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono-code font-bold text-slate-900">
                        {client.client_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{client.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono-code">
                            {client.enclave_type || 'Intel SGX Enclave'} &bull; {client.department || 'Clinical Research'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="px-4 py-3 font-mono-code">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${
                            client.trust_score >= 80
                              ? 'text-emerald-700'
                              : client.trust_score >= 50
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}>
                            {client.trust_score}%
                          </span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                client.trust_score >= 80
                                  ? 'bg-emerald-500'
                                  : client.trust_score >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${client.trust_score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono-code text-slate-600">
                        {client.samples_count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono-code">
                        <span className={`font-bold ${
                          client.historical_anomalies > 0 ? 'text-rose-600' : 'text-slate-600'
                        }`}>
                          {client.historical_anomalies}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono-code text-slate-600">
                        Round #{client.last_active_round}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.status === 'QUARANTINED' || client.status === 'BLOCKED' ? (
                            <button
                              onClick={(e) => handleOverride(e, client.client_id, 'REINSTATE')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                              title="Reinstate node to Trusted status"
                              type="button"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reinstate</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleOverride(e, client.client_id, 'QUARANTINE')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-2xs"
                              title="Force quarantine on this node"
                              type="button"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Quarantine</span>
                            </button>
                          )}

                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete hospital node ${client.client_id} (${client.name})?`)) {
                                await deleteHospitalClient(client.client_id);
                              }
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete this hospital node"
                            type="button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientId(client.client_id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="View full trust ledger & history"
                            type="button"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No hospital clients found matching query &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
