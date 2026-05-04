import { create } from "zustand";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  orgId: string | null;
  login: (token: string, user: User, orgId: string) => void;
  logout: () => void;
  setOrgId: (orgId: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  orgId: null,
  login: (accessToken, user, orgId) => set({ accessToken, user, orgId }),
  logout: () => {
    set({ user: null, accessToken: null, orgId: null });
    window.location.href = "/login";
  },
  setOrgId: (orgId) => set({ orgId }),
}));
