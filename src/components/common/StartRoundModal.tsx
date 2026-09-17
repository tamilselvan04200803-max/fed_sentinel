import React from 'react';
import { useFedSentinelStore } from '../../store/useFedSentinelStore';
import { RoundCreationWorkflow } from '@/src/features/federation/RoundCreationWorkflow';

/**
 * StartRoundModal
 * Connects global store trigger to the multi-step interactive
 * RoundCreationWorkflow control plane wizard with real preflight gating.
 */
export const StartRoundModal: React.FC = () => {
  const { isStartRoundModalOpen, setStartRoundModalOpen } = useFedSentinelStore();

  return (
    <RoundCreationWorkflow
      isOpen={isStartRoundModalOpen}
      onClose={() => setStartRoundModalOpen(false)}
      onSuccess={() => {
        setStartRoundModalOpen(false);
      }}
    />
  );
};
