import { create } from "zustand";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string;
  facility_id?: string;
  hospitalAffiliation?: string;
  clearanceLevel?: string;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile) => void;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
}

const STORAGE_TOKEN_KEY = "fedsentinel_auth_token";
const STORAGE_USER_KEY = "fedsentinel_auth_user";

// Initial state from localStorage or demo defaults
const getInitialToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_TOKEN_KEY) || "demo_token_secops_analyst";
};

const getInitialUser = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fall through to default
    }
  }
  return {
    id: "usr_secops_lead",
    name: "Dr. Vikram Sethi",
    email: "v.sethi@aiims.edu.in",
    role: "SOC_ANALYST",
    organization_id: "ORG-NATIONAL-HEALTH-01",
    facility_id: "FAC-H1",
    hospitalAffiliation: "All India Institute of Medical Sciences (AIIMS)",
    clearanceLevel: "LEVEL_3_ANALYST",
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: true,

  setAuth: (token: string, user: UserProfile) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  hasRole: (roles: string | string[]) => {
    const user = get().user;
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role) || user.role === "SUPER_ADMIN";
  },
}));

export const getAccessToken = (): string | null => {
  return useAuthStore.getState().token;
};
