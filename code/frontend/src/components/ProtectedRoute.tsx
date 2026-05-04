import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const { accessToken, user } = useAuthStore();
  const { pathname } = useLocation();

  if (!accessToken) return <Navigate to="/login" replace />;
  if (pathname.startsWith("/admin") && user?.role !== "ADMIN")
    return <Navigate to="/403" replace />;

  return <>{children}</>;
}
