import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Shield,
  Layers,
  Cpu,
  X,
  AlertTriangle,
  CheckCircle2,
  Hash,
  Activity,
} from 'lucide-react';
import { useFedSentinel } from '../../context/FedSentinelContext';
import { CreateClientRequest } from '../../types';

export const AddClientModal: React.FC = () => {
  const {
    isAddClientModalOpen,
    setAddClientModalOpen,
    addHospitalClient,
    isAddingClient,
    clients,
  } = useFedSentinel();

  // Suggest next ID based on existing clients (e.g. H7)
  const nextIdSuggestion = `H${clients.length + 1}`;

  const [clientId, setClientId] = useState(nextIdSuggestion);
  const [name, setName] = useState('');
  const [enclaveType, setEnclaveType] = useState('Intel SGX Enclave');
  const [samplesCount, setSamplesCount] = useState<number>(1200);
  const [trustScore, setTrustScore] = useState<number>(95);
  const [department, setDepartment] = useState('Radiology & Oncology');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAddClientModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = clientId.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanId || !cleanName) {
      setErrorMsg('Both Client ID (e.g. H7) and Hospital Name are required.');
      return;
    }

    // Check if ID already exists
    if (clients.some((c) => c.client_id.toUpperCase() === cleanId)) {
      setErrorMsg(`A hospital node with ID "${cleanId}" is already registered. Please use another ID.`);
      return;
    }

    const payload: CreateClientRequest = {
      client_id: cleanId,
      name: cleanName,
      status: trustScore >= 80 ? 'TRUSTED' : trustScore >= 50 ? 'REVIEW' : 'QUARANTINED',
      trust_score: trustScore,
      samples_count: samplesCount || 1000,
      enclave_type: enclaveType,
      department: department,
    };

    try {
      await addHospitalClient(payload);
      // Reset form
      setName('');
      setClientId(`H${clients.length + 2}`);
      setAddClientModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to register hospital node.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Register New Hospital Enclave Node
              </h3>
              <p className="text-xs text-slate-500 font-mono-code">
                Onboard clinical participant into Zero-Trust Federation
              </p>
            </div>
          </div>
          <button
            onClick={() => setAddClientModalOpen(false)}
            disabled={isAddingClient}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Client ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Node ID *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value.toUpperCase())}
                  placeholder="e.g. H7"
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-mono-code font-bold rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 uppercase"
                />
              </div>
            </div>

            {/* Hospital Name (2 Cols) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hospital / Institution Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hospital 7 - Mount Sinai Center"
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Enclave Hardware Attestation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confidential Hardware Enclave Platform *
            </label>
            <div className="relative">
              <Cpu className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={enclaveType}
                onChange={(e) => setEnclaveType(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
              >
                <option value="Intel SGX Enclave">Intel SGX Enclave (Hardware Attestation Pass)</option>
                <option value="AMD SEV-SNP Confidential VM">AMD SEV-SNP Confidential Virtual Machine</option>
                <option value="AWS Nitro Enclaves">AWS Nitro Enclaves (Cryptographic Attestation)</option>
                <option value="Apple Secure Enclave Server">Apple Secure Enclave Enterprise Server</option>
                <option value="Confidential Kubernetes Node">Confidential GKE / Kubernetes Node</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Clinical Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Department Cohort
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Radiology & Oncology">Radiology &amp; Oncology</option>
                <option value="Neurology & Brain Mapping">Neurology &amp; Brain Mapping</option>
                <option value="Cardiovascular Imaging">Cardiovascular Imaging</option>
                <option value="Pediatric Genetics">Pediatric Genetics</option>
                <option value="Immunology & Pathology">Immunology &amp; Pathology</option>
                <option value="General Clinical Trial">General Clinical Trial</option>
              </select>
            </div>

            {/* Clinical Samples Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Dataset Size (Samples)
              </label>
              <input
                type="number"
                min={50}
                max={50000}
                step={50}
                value={samplesCount}
                onChange={(e) => setSamplesCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs font-mono-code rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Initial Trust Score Slider */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Initial Zero-Trust Score
              </span>
              <span className={`font-mono-code font-bold text-sm ${
                trustScore >= 80 ? 'text-emerald-700' : trustScore >= 50 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {trustScore}% ({trustScore >= 80 ? 'TRUSTED' : trustScore >= 50 ? 'REVIEW' : 'QUARANTINED'})
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={trustScore}
              onChange={(e) => setTrustScore(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <span className="text-[11px] text-slate-500">
              Zero-Trust default for attested hardware enclaves is 95%. Updates are automatically evaluated by Layer 0-5 defense.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 mt-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddClientModalOpen(false)}
              disabled={isAddingClient}
              className="px-4 py-2 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingClient}
              className="px-4 py-2 text-xs font-bold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAddingClient ? 'Registering Enclave...' : 'Register Hospital Node'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
