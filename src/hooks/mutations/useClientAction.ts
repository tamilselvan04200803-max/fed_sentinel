import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { CLIENTS_QUERY_KEY } from "@/src/hooks/queries/useClients";
import { DASHBOARD_SUMMARY_KEY } from "@/src/hooks/queries/useDashboardSummary";
import { AUDIT_LOGS_KEY } from "@/src/hooks/queries/useAuditLogs";

interface ClientActionVariables {
  clientId: string;
  action: "QUARANTINE" | "REINSTATE" | "DEGRADE_TRUST";
  reason?: string;
  trust_score?: number;
}

export function useClientAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, action, reason, trust_score }: ClientActionVariables) => {
      return apiRequest(`/api/clients/${clientId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, reason, trust_score }),
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
