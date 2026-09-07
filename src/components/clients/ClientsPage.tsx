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
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { HospitalClient } from '../../types';

type SortField = 'trust_score' | 'status' | 'historical_anomalies' | 'last_active_round' | 'client_id' | 'samples_count';
type SortOrder = 'asc' | 'desc';

export const ClientsPage: React.FC = () => {
  const { clients, setSelectedClientId, isLoading } = useFedSentinel();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('trust_score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
          c.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" />
            Hospital Clients Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Distributed clinical enclave nodes participating in zero-trust federated model training.
          </p>
        </div>

        {/* Status Counts Pill */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold font-mono-code">
            {clients.filter((c) => c.status === 'TRUSTED').length} Trusted
          </span>
          <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold font-mono-code">
            {clients.filter((c) => c.status === 'REVIEW').length} Review
          </span>
          <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold font-mono-code">
            {clients.filter((c) => c.status === 'QUARANTINED').length} Quarantined
          </span>
          <span className="px-2 py-1 rounded bg-red-950 text-rose-200 border border-rose-900 font-semibold font-mono-code">
            {clients.filter((c) => c.status === 'BLOCKED').length} Blocked
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Client ID (e.g. H3) or Hospital Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Status:</span>
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
                    <span>Client ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Hospital Name</th>
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
                    <span>Samples</span>
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
                <th className="px-4 py-3 text-right">Action</th>
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
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {client.name}
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientId(client.client_id);
                          }}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold group-hover:underline text-[11px]"
                          type="button"
                        >
                          <span>Trust History</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900" />
                        </button>
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
