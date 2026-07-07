import { useState } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import type { UpdateSettingPayload } from "@/types";
import SettingRow from "./SettingsPage/components/SettingRow";
import SaveIndicator from "./SettingsPage/components/SaveIndicator";

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-[22px] w-10 rounded-full bg-border-light" />
          <div className="h-4 w-48 rounded bg-border-light" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10">
      <p className="text-[13px] text-text-secondary">Failed to load settings.</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-8 rounded-[3px] bg-ims-yellow px-3.5 text-xs font-semibold text-text-primary hover:bg-ims-yellow-dark"
      >
        Retry
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading, isError, refetch } = useSettings();
  const updateMutation = useUpdateSetting();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function handleUpdate(id: string, payload: UpdateSettingPayload) {
    setSaveStatus("saving");
    updateMutation.mutate(
      { id, payload },
      {
        onSuccess: () => setSaveStatus("saved"),
        onError: () => setSaveStatus("error"),
      },
    );
  }

  const sorted = settings?.slice().sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="p-4">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[15px] font-bold text-text-primary">Driver Check In Admin</span>
        <SaveIndicator
          status={saveStatus}
          onRetry={() => {
            if (updateMutation.variables) {
              handleUpdate(updateMutation.variables.id, updateMutation.variables.payload);
            }
          }}
        />
      </div>

      {isLoading && (
        <div className="rounded-[3px] border border-border-light bg-bg-surface" aria-busy="true" aria-label="Loading settings">
          <SkeletonRows />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {sorted && (
        <div className="rounded-[3px] border border-border-light bg-bg-surface">
          {sorted.map((s) => (
            <SettingRow key={s.id} setting={s} onUpdate={handleUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
