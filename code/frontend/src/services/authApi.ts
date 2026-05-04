import api from "@/services/api";
import type { User } from "@/types";

interface LoginResponse {
  accessToken: string;
  user: User & { org_id: string };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/v1/auth/login", { email, password });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/v1/auth/logout");
}
