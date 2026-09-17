import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";
import { ClientTrustInfo } from "@/src/types";

export function useTrustProfile(clientId?: string) {
  return useQuery({
    queryKey: ["trust", clientId],
    queryFn: async (): Promise<ClientTrustInfo> => {
      if (!clientId) throw new Error("Client ID required");
      return apiRequest<ClientTrustInfo>(`/api/trust/${clientId}`);
    },
    enabled: !!clientId,
    staleTime: 15_000,
  });
}
