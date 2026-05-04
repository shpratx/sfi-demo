import { useAuthStore } from "@/stores/authStore";

export const useAuth = () =>
  useAuthStore((s) => ({
    isAuthenticated: !!s.accessToken,
    user: s.user,
    orgId: s.orgId,
    login: s.login,
    logout: s.logout,
  }));
