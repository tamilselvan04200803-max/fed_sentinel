import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { CLIENTS_QUERY_KEY } from "@/src/hooks/queries/useClients";
import { DASHBOARD_SUMMARY_KEY } from "@/src/hooks/queries/useDashboardSummary";
import { AUDIT_LOGS_KEY } from "@/src/hooks/queries/useAuditLogs";

export interface LocalTrainParams {
  clientId: string;
  disease_type?: string;
  samples_count?: number;
  epochs?: number;
  learning_rate?: number;
  batch_size?: number;
  noise_level?: number;
  attack_mode?: string;
}

export function useTrainHospital() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, ...params }: LocalTrainParams) => {
      return apiRequest(`/api/hospitals/${clientId}/train`, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["client", vars.clientId] });
      queryClient.invalidateQueries({ queryKey: ["trust", vars.clientId] });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: AUDIT_LOGS_KEY });
    },
  });
}
