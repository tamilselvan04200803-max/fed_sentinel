import React, { useState } from 'react';
import {
  Play,
  RotateCw,
  AlertTriangle,
  Check,
  X,
  ShieldCheck,
  Sliders,
  PlusCircle,
  Hash,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { CreateClientRequest } from '../../types';

export const StartRoundModal: React.FC = () => {
  const {
    isStartRoundModalOpen,
    setStartRoundModalOpen,
    clients,
    rounds,
    startRound,
    isStartingRound,
    addHospitalClient,
  } = useFedSentinel();

  const currentRoundId = rounds[0]?.round_id ?? 24;
  const nextRoundId = currentRoundId + 1;

  // Tabs: 'standard' | 'custom'
  const [modalMode, setModalMode] = useState<'standard' | 'custom'>('standard');

  // Standard Quorum Selection
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(() =>
    clients.filter((c) => c.status !== 'BLOCKED').map((c) => c.client_id)
  );

  // Custom Input Mode fields
  const [customRoundId, setCustomRoundId] = useState<number>(nextRoundId);
  const [customAccuracy, setCustomAccuracy] = useState<number>(95.5);
  const [customQuarantinedIds, setCustomQuarantinedIds] = useState<string[]>(['H3']);
  const [customDefenseCutoff, setCustomDefenseCutoff] = useState<number>(0.75);

  // Inline Custom Hospital Node fields
  const [showInlineAdd, setShowInlineAdd] = useState<boolean>(false);
  const [newClientId, setNewClientId] = useState<string>(`H${clients.length + 1}`);
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientSamples, setNewClientSamples] = useState<number>(1200);
  const [newClientTrust, setNewClientTrust] = useState<number>(95);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isStartRoundModalOpen) return null;

  const toggleClient = (clientId: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const toggleQuarantineClient = (clientId: string) => {
    setCustomQuarantinedIds((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    setSelectedClientIds(clients.map((c) => c.client_id));
  };

  const handleSelectTrustedOnly = () => {
    setSelectedClientIds(clients.filter((c) => c.status === 'TRUSTED').map((c) => c.client_id));
  };

  const handleInlineAddHospital = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newClientId.trim() || !newClientName.trim()) {
      setErrorMsg('Custom node ID and name are required.');
      return;
    }
    const cleanId = newClientId.trim().toUpperCase();
    if (clients.some((c) => c.client_id.toUpperCase() === cleanId)) {
      setErrorMsg(`Node ID "${cleanId}" is already registered.`);
      return;
    }

    try {
      const payload: CreateClientRequest = {
        client_id: cleanId,
        name: newClientName.trim(),
        trust_score: newClientTrust,
        samples_count: newClientSamples,
        status: newClientTrust >= 80 ? 'TRUSTED' : newClientTrust >= 50 ? 'REVIEW' : 'QUARANTINED',
        enclave_type: 'Intel SGX Enclave',
        department: 'Clinical Enclave',
      };
      await addHospitalClient(payload);
      setSelectedClientIds((prev) => [...prev, cleanId]);
      setShowInlineAdd(false);
      setNewClientName('');
      setNewClientId(`H${clients.length + 2}`);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add custom hospital node.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (selectedClientIds.length === 0) {
      setErrorMsg('At least one client must be selected for federation.');
      return;
    }

    try {
      if (modalMode === 'custom') {
        await startRound({
          round_id: customRoundId || nextRoundId,
          target_clients: selectedClientIds,
          custom_accuracy: customAccuracy,
          custom_quarantined: customQuarantinedIds,
          defense_threshold: customDefenseCutoff,
        });
      } else {
        await startRound(selectedClientIds);
      }
      setStartRoundModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to start federation round.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white">
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Initiate Federation Round {modalMode === 'custom' ? `#${customRoundId}` : `#${nextRoundId}`}
              </h3>
              <p className="text-xs text-slate-500">
                Distributed gradient aggregation with zero-trust Byzantine verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStartRoundModalOpen(false)}
            disabled={isStartingRound}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setModalMode('standard')}
            className={`pb-2 px-2 border-b-2 transition-colors ${
              modalMode === 'standard'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Standard Quorum
          </button>
          <button
            type="button"
            onClick={() => setModalMode('custom')}
            className={`pb-2 px-2 border-b-2 flex items-center gap-1.5 transition-colors ${
              modalMode === 'custom'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3 h-3 text-emerald-600" />
            <span>Custom Input Values</span>
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Custom Mode Inputs Panel */}
          {modalMode === 'custom' && (
            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Custom Round Parameters
                </span>
                <span className="text-[10px] text-emerald-700 font-mono-code bg-emerald-100 px-1.5 py-0.5 rounded">
                  USER_OVERRIDE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Custom Round ID */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Round Number / Epoch
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customRoundId}
                    onChange={(e) => setCustomRoundId(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-mono-code font-bold rounded border border-slate-300 bg-white"
                  />
                </div>

                {/* Custom Target Accuracy */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Expected Global Accuracy (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={50}
                    max={100}
                    value={customAccuracy}
                    onChange={(e) => setCustomAccuracy(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-mono-code font-bold rounded border border-slate-300 bg-white text-emerald-700"
                  />
                </div>
              </div>

              {/* Anomaly / Quarantine Outlier Override */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Designate Outliers to Quarantine (Multi-Krum Filter)
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedClientIds.map((cid) => {
                    const isQuar = customQuarantinedIds.includes(cid);
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => toggleQuarantineClient(cid)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono-code font-bold transition-all ${
                          isQuar
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cid} {isQuar ? '⚠ (Quarantine)' : '(Clean)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Round Summary Card */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-slate-500 font-medium">Target Round</span>
              <span className="text-sm font-bold text-slate-900 font-mono-code">
                Round #{modalMode === 'custom' ? customRoundId : nextRoundId}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-slate-500 font-medium">Target Quorum</span>
              <span className="text-sm font-bold text-slate-900 font-mono-code">
                {selectedClientIds.length} / {clients.length} Nodes
              </span>
            </div>
          </div>

          {/* Client Selection Header & Options */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900">
                Participating Enclaves ({selectedClientIds.length} selected)
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowInlineAdd(!showInlineAdd)}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>{showInlineAdd ? 'Hide Add Form' : 'Add Custom Node'}</span>
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleSelectTrustedOnly}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  Trusted
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-slate-600 hover:text-slate-900 underline"
                >
                  All
                </button>
              </div>
            </div>

            {/* Inline Custom Node Creator Form */}
            {showInlineAdd && (
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-md flex flex-col gap-2.5 text-xs">
                <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Quick Add Custom Hospital Enclave
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Node ID</label>
                    <input
                      type="text"
                      value={newClientId}
                      onChange={(e) => setNewClientId(e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 text-xs font-mono-code font-bold uppercase rounded border border-slate-300 bg-white"
                      placeholder="e.g. H7"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-600 mb-0.5">Hospital Name</label>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
                      placeholder="e.g. Hospital 7 - Apollo Medical"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Samples Count</label>
                    <input
                      type="number"
                      value={newClientSamples}
                      onChange={(e) => setNewClientSamples(Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs font-mono-code rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-0.5">Initial Trust %</label>
                    <input
                      type="number"
                      value={newClientTrust}
                      onChange={(e) => setNewClientTrust(Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs font-mono-code rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleInlineAddHospital}
                    className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                  >
                    Register &amp; Select Node
                  </button>
                </div>
              </div>
            )}

            {/* Client List Checkboxes */}
            <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100 bg-white">
              {clients.map((client) => {
                const isChecked = selectedClientIds.includes(client.client_id);
                const isQuarantined = client.status === 'QUARANTINED';
                const isBlocked = client.status === 'BLOCKED';
                return (
                  <label
                    key={client.client_id}
                    className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                      isBlocked ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleClient(client.client_id)}
                        disabled={isStartingRound}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="font-mono-code font-bold text-slate-900">
                        {client.client_id}
                      </span>
                      <span className="text-slate-600 truncate max-w-[200px]">
                        {client.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold ${
                          client.status === 'TRUSTED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : client.status === 'REVIEW'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {client.status}
                      </span>
                      <span className="text-[11px] font-mono-code text-slate-500">
                        {client.trust_score}%
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            <span className="text-[11px] text-slate-500">
              Quarantined clients undergo Layer 0-5 pre-aggregation gatekeeping and are isolated by Multi-Krum defense.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStartRoundModalOpen(false)}
              disabled={isStartingRound}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isStartingRound || selectedClientIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isStartingRound ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Enclave Round...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>Start Round {modalMode === 'custom' ? `#${customRoundId}` : `#${nextRoundId}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
