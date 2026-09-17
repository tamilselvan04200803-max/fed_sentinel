import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { INCIDENTS_QUERY_KEY } from "@/src/hooks/queries/useIncidents";
import { CLIENTS_QUERY_KEY } from "@/src/hooks/queries/useClients";
import { DASHBOARD_SUMMARY_KEY } from "@/src/hooks/queries/useDashboardSummary";
import { AUDIT_LOGS_KEY } from "@/src/hooks/queries/useAuditLogs";

interface IncidentActionVariables {
  incidentId: string;
  action: "CONFIRM_QUARANTINE" | "OVERRIDE_REINSTATE" | "REQUEST_EVIDENCE";
  reason: string;
  actor?: string;
}

export function useIncidentAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ incidentId, action, reason, actor }: IncidentActionVariables) => {
      return apiRequest(`/api/incidents/${incidentId}/action`, {
        method: "POST",
        body: JSON.stringify({ action, reason, actor }),
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["incident", vars.incidentId] });
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: AUDIT_LOGS_KEY });
    },
  });
}
