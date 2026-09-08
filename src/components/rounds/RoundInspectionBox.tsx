import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Zap,
  Radio,
  Lock,
  Compass,
  Layers,
} from 'lucide-react';
import { FederationRound, HospitalClient } from '../../types';

interface RoundInspectionBoxProps {
  round: FederationRound | null;
  onSelectClient?: (clientId: string) => void;
  clients?: HospitalClient[];
}

export const RoundInspectionBox: React.FC<RoundInspectionBoxProps> = ({
  round,
  onSelectClient,
  clients = [],
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<number>(0); // 0: All, 1: Stage 1, 2: Stage 2, 3: Stage 3, 4: Stage 4
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [displayedAccuracy, setDisplayedAccuracy] = useState<number>(round ? round.global_accuracy - 0.5 : 94.0);
  const timerRef = useRef<any>(null);

  // Restart or trigger animation on round change
  useEffect(() => {
    if (!round) return;
    setDisplayedAccuracy(Math.max(80, Number((round.global_accuracy - 0.4).toFixed(1))));
    setIsPlaying(true);
    setActiveStage(1);

    const stepTime = 1400 / playbackSpeed;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveStage(2);
      timerRef.current = setTimeout(() => {
        setActiveStage(3);
        timerRef.current = setTimeout(() => {
          setActiveStage(4);
          // Animate accuracy counter
          const startAcc = Math.max(80, Number((round.global_accuracy - 0.5).toFixed(1)));
          const targetAcc = round.global_accuracy;
          const steps = 15;
          const delta = (targetAcc - startAcc) / steps;
          let stepCount = 0;
          const countInterval = setInterval(() => {
            stepCount++;
            setDisplayedAccuracy((prev) => {
              const next = Number((prev + delta).toFixed(1));
              if (stepCount >= steps || next >= targetAcc) {
                clearInterval(countInterval);
                return targetAcc;
              }
              return next;
            });
          }, 40 / playbackSpeed);

          timerRef.current = setTimeout(() => {
            setIsPlaying(false);
            setActiveStage(0); // View all
          }, 1800 / playbackSpeed);
        }, stepTime);
      }, stepTime);
    }, stepTime);

    return () => clearTimeout(timerRef.current);
  }, [round?.round_id, playbackSpeed]);

  const handleManualPlay = () => {
    if (!round) return;
    setIsPlaying(true);
    setActiveStage(1);
    const stepTime = 1300 / playbackSpeed;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActiveStage(2);
      timerRef.current = setTimeout(() => {
        setActiveStage(3);
        timerRef.current = setTimeout(() => {
          setActiveStage(4);
          setDisplayedAccuracy(round.global_accuracy);
          timerRef.current = setTimeout(() => {
            setIsPlaying(false);
            setActiveStage(0);
          }, 1800 / playbackSpeed);
        }, stepTime);
      }, stepTime);
    }, stepTime);
  };

  const handleStop = () => {
    clearTimeout(timerRef.current);
    setIsPlaying(false);
    setActiveStage(0);
    if (round) setDisplayedAccuracy(round.global_accuracy);
  };

  if (!round) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-8 text-center text-xs text-slate-400">
        Select a federation round from the historical log to inspect verification telemetry.
      </div>
    );
  }

  const hasQuarantined = round.quarantined_clients && round.quarantined_clients.length > 0;
  const acceptedRatio = round.accepted_clients.length;
  const totalRatio = round.participating_clients.length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 flex flex-col gap-4 relative overflow-hidden">
      {/* Background Animated Gradient Glow */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.07 }}
            exit={{ opacity: 0 }}
            className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500 rounded-full blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header with Animation Controls */}
      <div className="flex flex-col gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-mono-code text-slate-900">
                Round #{round.round_id} Inspection
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {round.status}
              </span>
            </div>
          </div>

          {/* Controls: Replay / Speed */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={isPlaying ? handleStop : handleManualPlay}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all shadow-2xs ${
                isPlaying
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
              type="button"
              title={isPlaying ? 'Pause Animation' : 'Replay Stage Verification Pipeline'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 text-amber-600" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                  <span>Animate</span>
                </>
              )}
            </button>

            <button
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
              className="px-1.5 py-1 rounded text-[10px] font-mono-code font-bold border border-slate-200 hover:bg-slate-100 text-slate-600"
              title="Toggle playback speed"
              type="button"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Executed: {new Date(round.timestamp).toLocaleString()}</span>
          {isPlaying && (
            <span className="flex items-center gap-1 text-emerald-600 font-mono-code font-bold animate-pulse">
              <Radio className="w-3 h-3 text-emerald-500" />
              Verifying Stage {activeStage}/4
            </span>
          )}
        </div>
      </div>

      {/* Stage Step Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-md text-[11px] font-medium text-slate-600">
        {[
          { id: 0, label: 'All Stages' },
          { id: 1, label: '1: Handshake' },
          { id: 2, label: '2: Centroid' },
          { id: 3, label: '3: Multi-Krum' },
          { id: 4, label: '4: Convergence' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              clearTimeout(timerRef.current);
              setIsPlaying(false);
              setActiveStage(tab.id);
            }}
            className={`flex-1 py-1 rounded transition-all text-center font-mono-code ${
              activeStage === tab.id
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'hover:text-slate-900'
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4-Stage Zero-Trust Aggregation Cards with Live Framer Motion Animations */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between">
          <span>Zero-Trust Verification Pipeline</span>
          <span className="font-mono-code text-[10px] font-normal text-slate-500">
            {activeStage === 0 ? 'Full Pipeline Active' : `Inspecting Stage ${activeStage}`}
          </span>
        </span>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
          {/* STAGE 1: TEE Handshake */}
          <motion.div
            animate={{
              borderColor: activeStage === 1 ? '#10b981' : '#e2e8f0',
              backgroundColor: activeStage === 1 ? '#f0fdf4' : '#f8fafc',
              scale: activeStage === 1 ? 1.02 : 1,
            }}
            transition={{ duration: 0.25 }}
            className={`p-2.5 rounded border relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeStage === 1 ? 'ring-1 ring-emerald-500/40' : ''
            }`}
            onClick={() => setActiveStage(1)}
          >
            {activeStage === 1 && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none"
              />
            )}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400 text-[10px] font-bold">STAGE 1</span>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <span className="font-bold text-slate-800 block text-xs">
                Format &amp; TEE Handshake
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {totalRatio} Enclaves Valid
              </span>
              <span className="text-[9px] text-slate-400 font-mono-code">SIG_PASS</span>
            </div>
          </motion.div>

          {/* STAGE 2: Gradient Centroid Probe */}
          <motion.div
            animate={{
              borderColor: activeStage === 2 ? '#10b981' : '#e2e8f0',
              backgroundColor: activeStage === 2 ? '#f0fdf4' : '#f8fafc',
              scale: activeStage === 2 ? 1.02 : 1,
            }}
            transition={{ duration: 0.25 }}
            className={`p-2.5 rounded border relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeStage === 2 ? 'ring-1 ring-emerald-500/40' : ''
            }`}
            onClick={() => setActiveStage(2)}
          >
            {activeStage === 2 && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none"
              />
            )}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400 text-[10px] font-bold">STAGE 2</span>
                <Activity className="w-3 h-3 text-slate-400" />
              </div>
              <span className="font-bold text-slate-800 block text-xs">
                Gradient Centroid Probe
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-emerald-700 text-[10px] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Cosine &ge; 0.75 Cutoff
              </span>
              <span className="text-[9px] text-slate-400 font-mono-code">MEDIAN_OK</span>
            </div>
          </motion.div>

          {/* STAGE 3: Multi-Krum Defense */}
          <motion.div
            animate={{
              borderColor:
                activeStage === 3
                  ? hasQuarantined
                    ? '#f43f5e'
                    : '#10b981'
                  : '#e2e8f0',
              backgroundColor:
                activeStage === 3
                  ? hasQuarantined
                    ? '#fff1f2'
                    : '#f0fdf4'
                  : '#f8fafc',
              scale: activeStage === 3 ? 1.02 : 1,
            }}
            transition={{ duration: 0.25 }}
            className={`p-2.5 rounded border relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeStage === 3
                ? hasQuarantined
                  ? 'ring-1 ring-rose-500/40'
                  : 'ring-1 ring-emerald-500/40'
                : ''
            }`}
            onClick={() => setActiveStage(3)}
          >
            {activeStage === 3 && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className={`absolute inset-y-0 w-8 bg-gradient-to-r from-transparent ${
                  hasQuarantined ? 'via-rose-300/40' : 'via-emerald-300/40'
                } to-transparent pointer-events-none`}
              />
            )}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400 text-[10px] font-bold">STAGE 3</span>
                <ShieldAlert className="w-3 h-3 text-slate-400" />
              </div>
              <span className="font-bold text-slate-800 block text-xs">
                Multi-Krum Filter
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-[10px] font-semibold flex items-center gap-1 ${
                  hasQuarantined ? 'text-rose-700 font-bold' : 'text-emerald-700'
                }`}
              >
                {hasQuarantined ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {round.quarantined_clients.length} Outlier Excluded
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    0 Outliers Detected
                  </>
                )}
              </span>
              <span className="text-[9px] text-slate-400 font-mono-code">KRUM_SHIELD</span>
            </div>
          </motion.div>

          {/* STAGE 4: Global Weight Update */}
          <motion.div
            animate={{
              borderColor: activeStage === 4 ? '#10b981' : '#e2e8f0',
              backgroundColor: activeStage === 4 ? '#f0fdf4' : '#f8fafc',
              scale: activeStage === 4 ? 1.02 : 1,
            }}
            transition={{ duration: 0.25 }}
            className={`p-2.5 rounded border relative overflow-hidden flex flex-col justify-between cursor-pointer ${
              activeStage === 4 ? 'ring-1 ring-emerald-500/40' : ''
            }`}
            onClick={() => setActiveStage(4)}
          >
            {activeStage === 4 && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none"
              />
            )}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-400 text-[10px] font-bold">STAGE 4</span>
                <Sparkles className="w-3 h-3 text-slate-400" />
              </div>
              <span className="font-bold text-slate-800 block text-xs">
                Global Weight Update
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Acc: {displayedAccuracy.toFixed(1)}%
              </span>
              <span className="text-[9px] text-emerald-600 font-bold font-mono-code">+0.3%</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stage Detail Showcase Card (Changes dynamically when a stage is active) */}
      <AnimatePresence mode="wait">
        {activeStage === 1 && (
          <motion.div
            key="stage1_detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md flex flex-col gap-1.5 text-xs font-mono-code"
          >
            <div className="flex items-center justify-between font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Stage 1: Enclave Cryptographic Attestation
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Verified 100%
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 font-sans">
              All {totalRatio} participating enclaves provided valid platform certificate registers (PCRs) and Intel SGX / AWS Nitro hardware quote signatures.
            </p>
            <div className="w-full bg-emerald-200/80 h-1.5 rounded-full overflow-hidden mt-1">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8 }}
                className="bg-emerald-600 h-full"
              />
            </div>
          </motion.div>
        )}

        {activeStage === 2 && (
          <motion.div
            key="stage2_detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-md flex flex-col gap-1.5 text-xs font-mono-code"
          >
            <div className="flex items-center justify-between font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                Stage 2: Spatial Drift &amp; Centroid Probing
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Cutoff &ge; 0.75
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 font-sans">
              Gradient vectors projected across high-dimensional space. Cosine similarity against coordinate-wise median evaluated for zero-drift convergence.
            </p>
            <div className="flex items-center justify-between text-[10px] text-emerald-800 mt-1">
              <span>Mean Cosine Sim: 0.892</span>
              <span>L2 Norm Variance: 0.018</span>
            </div>
          </motion.div>
        )}

        {activeStage === 3 && (
          <motion.div
            key="stage3_detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-md flex flex-col gap-1.5 text-xs font-mono-code ${
              hasQuarantined
                ? 'bg-rose-50/80 border border-rose-200 text-rose-950'
                : 'bg-emerald-50/60 border border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className={`w-3.5 h-3.5 ${hasQuarantined ? 'text-rose-600' : 'text-emerald-600'}`} />
                Stage 3: Multi-Krum Byzantine Defense Filter
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  hasQuarantined ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {hasQuarantined ? 'BYZANTINE ALERT' : 'SECURE QUORUM'}
              </span>
            </div>
            <p className={`text-[11px] font-sans ${hasQuarantined ? 'text-rose-800' : 'text-emerald-800'}`}>
              {hasQuarantined
                ? `Adversarial outlier vector detected in node [${round.quarantined_clients.join(', ')}]. Zero-trust filter isolated gradient to protect global model integrity.`
                : 'All participant gradient vectors satisfy Euclidean distance bounds. Zero adversarial perturbations detected.'}
            </p>
          </motion.div>
        )}

        {activeStage === 4 && (
          <motion.div
            key="stage4_detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 bg-slate-900 text-white rounded-md flex flex-col gap-1.5 text-xs font-mono-code shadow-xs"
          >
            <div className="flex items-center justify-between font-bold text-slate-100">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Stage 4: Federated Global Model Synthesized
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-1.5 py-0.5 rounded">
                +0.3% Convergence
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-400 font-sans">Updated Global Accuracy:</span>
              <span className="text-base font-bold text-emerald-400">
                {displayedAccuracy.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-0.5">
              <motion.div
                initial={{ width: '85%' }}
                animate={{ width: `${Math.min(100, displayedAccuracy)}%` }}
                transition={{ duration: 0.6 }}
                className="bg-emerald-400 h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participating Nodes Attestation Matrix with Animated Weight Bars */}
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
            Participant Attestation Matrix
          </span>
          <span className="font-mono-code text-[11px] text-slate-500">
            {acceptedRatio}/{totalRatio} Accepted ({((acceptedRatio / totalRatio) * 100).toFixed(0)}%)
          </span>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          {round.participating_clients.map((clientId, idx) => {
            const isQuarantined = round.quarantined_clients.includes(clientId);
            const weightPercent = isQuarantined ? 0 : 100 / Math.max(1, acceptedRatio);
            const clientObj = clients.find((c) => c.client_id === clientId);

            return (
              <motion.div
                key={clientId}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.25 }}
                onClick={() => onSelectClient && onSelectClient(clientId)}
                className={`p-2.5 flex flex-col gap-1.5 hover:bg-slate-100/80 cursor-pointer transition-colors ${
                  isQuarantined ? 'bg-rose-50/40' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code font-bold text-slate-900 text-xs">
                      {clientId}
                    </span>
                    <span className="text-slate-600 text-[11px] truncate max-w-[150px]">
                      {clientObj?.name || 'Clinical Enclave Node'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isQuarantined ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        QUARANTINED (0.0% Wt)
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACCEPTED ({weightPercent.toFixed(1)}% Wt)
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Animated Contribution Progress Bar */}
                <div className="w-full bg-slate-200/70 h-1 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weightPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + idx * 0.05 }}
                    className={`h-full ${isQuarantined ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
