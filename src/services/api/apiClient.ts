import { getAccessToken } from "@/src/services/auth/authStore";

export class ApiError extends Error {
  status: number;
  errorCode: string;
  details?: any;

  constructor(status: number, errorCode: string, message: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export function getApiBaseUrl(): string {
  let base = "http://127.0.0.1:8000";

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("fedsentinel_api_url");
    if (stored && stored.trim().length > 0) {
      base = stored.trim();
    }
  }

  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    base = envUrl.trim();
  }

  // Strip trailing slashes and any trailing /api segment
  return base.replace(/\/+$/, "").replace(/\/api$/i, "");
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${base}${cleanEndpoint}`;

  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON error body
    }

    const errorCode = errorData.error || `HTTP_${response.status}`;
    const message = errorData.message || errorData.detail || response.statusText || "Request failed";
    throw new ApiError(response.status, errorCode, message, errorData.details);
  }

  return response.json();
}
