import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSetting, generateQrCode } from "@/services/settingsApi";
import type { Setting, UpdateSettingPayload } from "@/types";

export function useSettings() {
  return useQuery<Setting[]>({
    queryKey: ["settings"],
    queryFn: getSettings,
    staleTime: 30_000,
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSettingPayload }) =>
      updateSetting(id, payload),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: ["settings"] });
      const prev = qc.getQueryData<Setting[]>(["settings"]);
      if (prev) {
        qc.setQueryData<Setting[]>(["settings"], (old) =>
          old?.map((s) =>
            s.id === id
              ? { ...s, ...payload, versionNum: s.versionNum + 1 }
              : s,
          ),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["settings"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useGenerateQr() {
  return useMutation({ mutationFn: generateQrCode });
}
