import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";

export const DASHBOARD_SUMMARY_KEY = ["dashboard", "summary"] as const;

export interface DashboardSummary {
  system_status: string;
  active_hospitals: number;
  quarantined_nodes: number;
  total_rounds: number;
  latest_round_id: number;
  global_accuracy: number;
  open_incidents: number;
  threat_level: "NOMINAL" | "ELEVATED" | "CRITICAL";
  defense_mode: "ARMED" | "BYPASS";
  timestamp: string;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_SUMMARY_KEY,
    queryFn: async (): Promise<DashboardSummary> => {
      return apiRequest<DashboardSummary>("/api/dashboard/summary");
    },
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
}
