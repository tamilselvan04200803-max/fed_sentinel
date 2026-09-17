import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { ROUNDS_QUERY_KEY } from "@/src/hooks/queries/useRounds";
import { DASHBOARD_SUMMARY_KEY } from "@/src/hooks/queries/useDashboardSummary";
import { MODEL_STATUS_KEY } from "@/src/hooks/queries/useModelStatus";
import { StartRoundRequest, FederationRound } from "@/src/types";

export function useStartRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: StartRoundRequest = {}): Promise<FederationRound> => {
      const res = await apiRequest<{ round?: FederationRound } & FederationRound>("/api/rounds/start", {
        method: "POST",
        body: JSON.stringify(req),
      });
      return res.round || res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUNDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_KEY });
      queryClient.invalidateQueries({ queryKey: MODEL_STATUS_KEY });
    },
  });
}
