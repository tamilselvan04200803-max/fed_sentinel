import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";

export const AUDIT_LOGS_KEY = ["audit", "logs"] as const;

export interface AuditRecord {
  audit_id: string;
  incident_id?: string;
  action: string;
  actor: string;
  client_id?: string;
  round_id?: number;
  reason: string;
  timestamp: string;
  prev_hash: string;
  audit_hash: string;
  attestation?: string;
}

export function useAuditLogs(actor?: string, action?: string) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_KEY, actor || "", action || ""],
    queryFn: async (): Promise<AuditRecord[]> => {
      let query = "";
      const params = new URLSearchParams();
      if (actor) params.set("actor", actor);
      if (action) params.set("action", action);
      if (params.toString()) query = `?${params.toString()}`;

      const res = await apiRequest<{ logs: AuditRecord[]; count: number }>(`/api/audit/logs${query}`);
      return res.logs || [];
    },
    staleTime: 15_000,
  });
}

export function useAuditVerification() {
  return useQuery({
    queryKey: ["audit", "verify"],
    queryFn: async () => {
      return apiRequest<{
        status: string;
        verified_count: number;
        chain_valid: boolean;
        tampered_record_index?: number | null;
        root_hash?: string;
      }>("/api/audit/verify");
    },
    staleTime: 30_000,
  });
}
