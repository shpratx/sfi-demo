import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const correlationId = crypto.randomUUID();
  config.headers["X-Correlation-ID"] = correlationId;

  const { accessToken, orgId } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (orgId) config.headers["X-Organization-Id"] = orgId;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const correlationId =
      (error.config?.headers?.["X-Correlation-ID"] as string) ?? "";

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    if (error.response?.status === 403) {
      window.location.href = "/403";
    }

    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      code: error.response?.data?.code ?? "UNKNOWN",
      message: error.response?.data?.message ?? error.message,
      correlationId,
    };

    return Promise.reject(apiError);
  },
);

export default api;
