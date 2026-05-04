import { useState } from "react";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import type { UpdateSettingPayload } from "@/types";
import SettingRow from "./SettingsPage/components/SettingRow";
import SaveIndicator from "./SettingsPage/components/SaveIndicator";

function SkeletonRows() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-6 w-10 rounded-full bg-border-light" />
          <div className="h-4 w-48 rounded bg-border-light" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10">
      <p className="text-text-secondary">Failed to load settings.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded bg-hive-yellow px-4 py-2 text-sm font-semibold text-text-primary hover:bg-hive-yellow-dark"
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
  const identity = sorted?.filter((s) => s.displayOrder <= 6);
  const config = sorted?.filter((s) => s.displayOrder > 6);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-[16px] font-semibold">Driver Check In Admin</h1>
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
        <div className="rounded-lg bg-bg-surface shadow-sm" aria-busy="true" aria-label="Loading settings">
          <SkeletonRows />
        </div>
      )}

      {isError && <ErrorState onRetry={() => void refetch()} />}

      {sorted && (
        <div className="space-y-6">
          {identity && identity.length > 0 && (
            <section role="group" aria-label="Driver Identity">
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Driver Identity</h2>
              <div className="rounded-lg bg-bg-surface shadow-sm">
                {identity.map((s) => (
                  <SettingRow key={s.id} setting={s} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          )}

          {config && config.length > 0 && (
            <section role="group" aria-label="Check In Configuration">
              <h2 className="mb-2 text-sm font-semibold text-text-secondary">Check In Configuration</h2>
              <div className="rounded-lg bg-bg-surface shadow-sm">
                {config.map((s) => (
                  <SettingRow key={s.id} setting={s} onUpdate={handleUpdate} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
