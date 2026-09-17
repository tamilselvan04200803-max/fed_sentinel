import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";

export const SECURITY_CONFIG_KEY = ["security", "config"] as const;

export interface SecurityConfig {
  defense_enabled: boolean;
  aggregation_strategy: string;
  auto_quarantine: boolean;
  quarantine_threshold: number;
  observation_threshold: number;
  max_norm_clip: number;
  differential_privacy: {
    enabled: boolean;
    target_epsilon: number;
    target_delta: number;
    noise_multiplier: number;
  };
  layers: Record<string, string>;
  policy_version: string;
}

export function useSecurityConfig() {
  return useQuery({
    queryKey: SECURITY_CONFIG_KEY,
    queryFn: async (): Promise<SecurityConfig> => {
      return apiRequest<SecurityConfig>("/api/security/config");
    },
    staleTime: 30_000,
  });
}
