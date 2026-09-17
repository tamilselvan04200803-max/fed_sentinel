import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { MODEL_STATUS_KEY, MODEL_VERSIONS_KEY } from "@/src/hooks/queries/useModelStatus";
import { ROUNDS_QUERY_KEY } from "@/src/hooks/queries/useRounds";
import { DASHBOARD_SUMMARY_KEY } from "@/src/hooks/queries/useDashboardSummary";
import { AUDIT_LOGS_KEY } from "@/src/hooks/queries/useAuditLogs";

interface ModelRollbackVariables {
  targetRoundId: number;
  reason: string;
}

export function useModelRollback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetRoundId, reason }: ModelRollbackVariables) => {
      return apiRequest("/api/model/rollback", {
        method: "POST",
        body: JSON.stringify({
          target_round_id: targetRoundId,
          reason,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: MODEL_VERSIONS_KEY });
      queryClient.invalidateQueries({ queryKey: ROUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: AUDIT_LOGS_KEY });
    },
  });
}
