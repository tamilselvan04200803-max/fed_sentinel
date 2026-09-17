import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { FederationRound } from "@/src/types";

export const ROUNDS_QUERY_KEY = ["rounds"] as const;

export function useRounds() {
  return useQuery({
    queryKey: ROUNDS_QUERY_KEY,
    queryFn: async (): Promise<FederationRound[]> => {
      const data = await apiRequest<FederationRound[] | { items: FederationRound[] }>("/api/rounds");
      if (Array.isArray(data)) {
        return data;
      }
      return data.items || [];
    },
    staleTime: 10_000,
  });
}

export function useRoundDetail(roundId?: number) {
  return useQuery({
    queryKey: ["round", roundId],
    queryFn: async (): Promise<FederationRound> => {
      if (roundId === undefined) throw new Error("Round ID required");
      return apiRequest<FederationRound>(`/api/rounds/${roundId}`);
    },
    enabled: roundId !== undefined,
    staleTime: 30_000,
  });
}
