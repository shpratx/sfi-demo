import api from "@/services/api";
import type { Setting, UpdateSettingPayload } from "@/types";

export async function getSettings(): Promise<Setting[]> {
  const { data } = await api.get<Setting[]>("/v1/driver-checkin/settings");
  return data;
}

export async function updateSetting(
  id: string,
  payload: UpdateSettingPayload,
): Promise<{ id: string; versionNum: number; updatedAt: string }> {
  const { data } = await api.put(`/v1/driver-checkin/settings/${id}`, payload);
  return data;
}

export async function generateQrCode(): Promise<Blob> {
  const { data } = await api.post("/v1/driver-checkin/qr-code", null, {
    responseType: "blob",
    headers: { Accept: "image/png" },
  });
  return data as Blob;
}

export async function downloadQrPdf(): Promise<Blob> {
  const { data } = await api.get("/v1/driver-checkin/qr-code/pdf", {
    responseType: "blob",
    headers: { Accept: "application/pdf" },
  });
  return data as Blob;
}
