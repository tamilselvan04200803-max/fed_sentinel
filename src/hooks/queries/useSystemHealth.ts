import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";

export const SYSTEM_HEALTH_KEY = ["system", "health"] as const;

export interface SystemHealth {
  status: string;
  service: string;
  version: string;
  environment: string;
  demo_mode: boolean;
  timestamp: string;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: SYSTEM_HEALTH_KEY,
    queryFn: async (): Promise<SystemHealth> => {
      return apiRequest<SystemHealth>("/health");
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}
