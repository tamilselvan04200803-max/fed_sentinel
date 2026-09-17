import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { HospitalClient, ClientReadiness } from "@/src/types";

export const CLIENTS_QUERY_KEY = ["clients"] as const;

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_QUERY_KEY,
    queryFn: async (): Promise<HospitalClient[]> => {
      const data = await apiRequest<HospitalClient[] | { items: HospitalClient[] }>("/api/clients");
      if (Array.isArray(data)) {
        return data;
      }
      return data.items || [];
    },
    staleTime: 15_000,
  });
}

export function useClient(clientId?: string) {
  return useQuery({
    queryKey: ["client", clientId],
    queryFn: async (): Promise<HospitalClient> => {
      if (!clientId) throw new Error("Client ID required");
      return apiRequest<HospitalClient>(`/api/clients/${clientId}`);
    },
    enabled: !!clientId,
    staleTime: 15_000,
  });
}

export function useClientReadiness(clientId?: string) {
  return useQuery({
    queryKey: ["client", clientId, "readiness"],
    queryFn: async (): Promise<ClientReadiness> => {
      if (!clientId) throw new Error("Client ID required");
      return apiRequest<ClientReadiness>(`/api/clients/${clientId}/readiness`);
    },
    enabled: !!clientId,
    staleTime: 10_000,
  });
}

