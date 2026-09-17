import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { Incident } from "@/src/types";

export const INCIDENTS_QUERY_KEY = ["incidents"] as const;

export function useIncidents(statusFilter?: string) {
  return useQuery({
    queryKey: statusFilter ? [...INCIDENTS_QUERY_KEY, statusFilter] : INCIDENTS_QUERY_KEY,
    queryFn: async (): Promise<Incident[]> => {
      const endpoint = statusFilter ? `/api/incidents?status=${statusFilter}` : "/api/incidents";
      const data = await apiRequest<Incident[] | { items: Incident[] }>(endpoint);
      if (Array.isArray(data)) {
        return data;
      }
      return data.items || [];
    },
    staleTime: 10_000,
  });
}

export function useIncident(incidentId?: string) {
  return useQuery({
    queryKey: ["incident", incidentId],
    queryFn: async (): Promise<Incident> => {
      if (!incidentId) throw new Error("Incident ID required");
      const res = await apiRequest<{ incident?: Incident } & Incident>(`/api/incidents/${incidentId}`);
      return res.incident || res;
    },
    enabled: !!incidentId,
    staleTime: 20_000,
  });
}
