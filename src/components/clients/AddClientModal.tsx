import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Shield,
  Cpu,
  X,
  AlertTriangle,
  Hash,
  Database,
  Activity,
} from 'lucide-react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { HospitalClient } from '../../types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const { hospitals, setHospitals, addToast, settings } = useFedSentinelStore();

  const nextIdSuggestion = `H${hospitals.length + 1}`;

  const [clientId, setClientId] = useState(nextIdSuggestion);
  const [name, setName] = useState('');
  const [diseaseCohort, setDiseaseCohort] = useState<'PNEUMONIA' | 'GLIOBLASTOMA'>('PNEUMONIA');
  const [enclaveType, setEnclaveType] = useState('Intel SGX Enclave');
  const [samplesCount, setSamplesCount] = useState<number>(1200);
  const [trustScore, setTrustScore] = useState<number>(95);
  const [department, setDepartment] = useState('Pulmonology & Respiratory Medicine');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanId = clientId.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanId || !cleanName) {
      setErrorMsg('Both Client ID and Hospital Name are required.');
      return;
    }

    if (hospitals.some((c) => c.client_id.toUpperCase() === cleanId)) {
      setErrorMsg(`A hospital node with ID "${cleanId}" is already registered.`);
      return;
    }

    setIsSubmitting(true);
    const newClient: HospitalClient = {
      client_id: cleanId,
      name: cleanName,
      status: trustScore >= 80 ? 'TRUSTED' : trustScore >= 50 ? 'REVIEW' : 'QUARANTINED',
      trust_score: trustScore,
      samples_count: samplesCount || 1000,
      historical_anomalies: 0,
      last_active_round: 24,
      enclave_type: enclaveType,
      department: department,
      disease_cohort: diseaseCohort,
    };

    try {
      const res = await fetch(`${settings.apiBaseUrl}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      if (res.ok) {
        const saved = await res.json();
        setHospitals([...hospitals, saved.client || saved]);
        addToast({
          type: 'success',
          title: 'Hospital Node Enrolled',
          message: `${cleanName} (${cleanId}) joined the federated network under ${enclaveType}.`,
        });
        onClose();
      } else {
        const err = await res.json().catch(() => ({ detail: 'Failed to enroll hospital node.' }));
        setErrorMsg(err.detail || 'Failed to enroll hospital node.');
      }
    } catch (err: any) {
      setHospitals([...hospitals, newClient]);
      addToast({
        type: 'success',
        title: 'Hospital Node Enrolled (Local)',
        message: `${cleanName} (${cleanId}) registered in local store.`,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col text-slate-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Register New Hospital Enclave Node
              </h3>
              <p className="text-xs text-slate-400 font-mono-code">
                Zero-Trust cryptographic onboarding into clinical federation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Node ID *
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value.toUpperCase())}
                  placeholder="e.g. H7"
                  className="w-full pl-9 pr-3 py-1.5 font-mono-code font-bold rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-100"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Hospital / Institution Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hospital 7 - Mount Sinai Medical Center"
                  className="w-full pl-9 pr-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
              Clinical Disease Cohort *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiseaseCohort('PNEUMONIA');
                  setDepartment('Pulmonology & Respiratory Medicine');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  diseaseCohort === 'PNEUMONIA'
                    ? 'bg-cyan-950/40 border-brand-cyan text-brand-cyan shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  🫁 Pediatric Pulmonology
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Chest X-Ray Pneumonia Opacity (28x28)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDiseaseCohort('GLIOBLASTOMA');
                  setDepartment('Neuro-Oncology & Brain Tumor Center');
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  diseaseCohort === 'GLIOBLASTOMA'
                    ? 'bg-indigo-950/40 border-indigo-400 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1.5">
                  🧠 Neuro-Oncology
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Brain MRI Glioblastoma Pathology (28x28)</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Clinical Department / Research Unit
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Hardware Enclave (TEE)
              </label>
              <select
                value={enclaveType}
                onChange={(e) => setEnclaveType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-200"
              >
                <option value="Intel SGX Enclave">Intel SGX Enclave</option>
                <option value="AMD SEV-SNP Confidential VM">AMD SEV-SNP Confidential VM</option>
                <option value="AWS Nitro Enclaves">AWS Nitro Enclaves</option>
                <option value="Apple Secure Enclave Server">Apple Secure Enclave Server</option>
                <option value="Confidential Kubernetes Node">Confidential Kubernetes Node</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Private Dataset Size (DICOM Scans)
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                step={50}
                value={samplesCount}
                onChange={(e) => setSamplesCount(parseInt(e.target.value) || 1000)}
                className="w-full px-3 py-1.5 font-mono-code font-bold rounded-md bg-slate-950 border border-slate-800 focus:outline-none focus:border-brand-cyan text-slate-100"
              />
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(0,240,255,0.25)] flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Register Enclave Node'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
