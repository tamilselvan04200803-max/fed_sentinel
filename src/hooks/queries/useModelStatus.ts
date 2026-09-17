import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/src/services/api/apiClient";

export const MODEL_STATUS_KEY = ["model", "status"] as const;
export const MODEL_CARD_KEY = ["model", "card"] as const;
export const MODEL_VERSIONS_KEY = ["model", "versions"] as const;
export const MODEL_EXPERIMENTS_KEY = ["model", "experiments"] as const;

export interface ModelStatus {
  model_version: string;
  architecture: string;
  parameter_count: number;
  task: string;
  global_accuracy: number;
  input_resolution: string;
  classes: string[];
  defense_active: boolean;
  checksum: string;
}

export interface ModelVersionItem {
  version_id: string;
  version_str: string;
  round_id: number;
  status: string;
  global_accuracy: number;
  loss: number;
  checksum_sha256: string;
  created_at: string;
}

export function useModelStatus() {
  return useQuery({
    queryKey: MODEL_STATUS_KEY,
    queryFn: async (): Promise<ModelStatus> => {
      return apiRequest<ModelStatus>("/api/model/status");
    },
    staleTime: 20_000,
  });
}

export function useModelCard() {
  return useQuery({
    queryKey: MODEL_CARD_KEY,
    queryFn: async (): Promise<any> => {
      return apiRequest<any>("/api/model/card");
    },
    staleTime: 60_000,
  });
}

export function useModelVersions() {
  return useQuery({
    queryKey: MODEL_VERSIONS_KEY,
    queryFn: async (): Promise<ModelVersionItem[]> => {
      const res = await apiRequest<{ versions: ModelVersionItem[] }>("/api/model/versions");
      return res.versions || [];
    },
    staleTime: 30_000,
  });
}

export function useModelExperiments(modelFamily?: string) {
  return useQuery({
    queryKey: [...MODEL_EXPERIMENTS_KEY, modelFamily],
    queryFn: async (): Promise<any[]> => {
      const url = modelFamily
        ? `/api/models/experiments?model_family=${encodeURIComponent(modelFamily)}`
        : "/api/models/experiments";
      return apiRequest<any[]>(url);
    },
    staleTime: 30_000,
  });
}

export function useRunModelExperiment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      defense_strategy?: string;
      attack_type?: string;
      seed?: number;
      client_count?: number;
      attack_intensity?: number;
      noise_level?: number;
    }) => {
      return apiRequest<any>("/api/models/experiments/run", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODEL_EXPERIMENTS_KEY });
    },
  });
}

