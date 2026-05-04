import { useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import type { Setting, UpdateSettingPayload } from "@/types";
import CompositeInput from "./CompositeInput";
import QrCodeSection from "./QrCodeSection";

const VALIDATORS: Record<string, (v: string) => string | null> = {
  ALPHANUMERIC: (v) => {
    if (!v) return "Required";
    if (v.length > 200) return "Max 200 characters";
    if (!/^[a-zA-Z0-9\s\-°/]*$/.test(v)) return "Only letters, numbers, spaces, -, °, /";
    return null;
  },
  NUMERIC: (v) => {
    if (!v) return "Required";
    if (!/^\d+$/.test(v)) return "Digits only";
    if (Number(v) > 999) return "Max 999";
    return null;
  },
  TEXT: (v) => {
    if (!v) return "Required";
    if (v.length > 2000) return "Max 2000 characters";
    return null;
  },
  TEXTAREA: (v) => {
    if (!v) return "Required";
    if (v.length > 2000) return "Max 2000 characters";
    return null;
  },
};

export default function SettingRow({
  setting,
  onUpdate,
}: {
  setting: Setting;
  onUpdate: (id: string, payload: UpdateSettingPayload) => void;
}) {
  const [inputVal, setInputVal] = useState(setting.inputValue ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleToggle(checked: boolean) {
    if (setting.toggleLocked) return;
    onUpdate(setting.id, { toggleState: checked, versionNum: setting.versionNum });
  }

  function handleInputBlur() {
    const validate = VALIDATORS[setting.inputType];
    if (validate) {
      const err = validate(inputVal);
      setError(err);
      if (err) return;
    }
    if (inputVal !== setting.inputValue) {
      onUpdate(setting.id, { inputValue: inputVal, versionNum: setting.versionNum });
    }
  }

  function handleCompositeBlur(val: string) {
    if (val !== setting.inputValue) {
      onUpdate(setting.id, { inputValue: val, versionNum: setting.versionNum });
    }
  }

  const isQrSetting = setting.settingName === "QR_CODE_ACCESS";
  const showInput = setting.inputType && setting.toggleState;

  return (
    <div className="flex flex-col gap-2 border-b border-border-light px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Switch.Root
          checked={setting.toggleState}
          onCheckedChange={handleToggle}
          disabled={setting.toggleLocked}
          aria-label={setting.settingName.replace(/_/g, " ").replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())}
          className={`relative h-6 w-10 rounded-full transition-colors ${
            setting.toggleState ? "bg-hive-yellow" : "bg-border-light"
          } ${setting.toggleLocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        >
          <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[18px]" />
        </Switch.Root>
        <span className="text-sm text-text-primary">{setting.settingName.replace(/_/g, " ")}</span>
      </div>
      {setting.toggleLocked && (
        <p className="ml-[52px] text-xs text-text-secondary">This setting is always enabled</p>
      )}

      {showInput && setting.inputType === "COMPOSITE" && (
        <CompositeInput value={inputVal} onSave={handleCompositeBlur} />
      )}

      {showInput && setting.inputType === "TEXTAREA" && (
        <div>
          <textarea
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(null); }}
            onBlur={handleInputBlur}
            rows={3}
            className="w-full rounded border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hive-yellow"
          />
          {error && <p role="alert" className="mt-1 text-xs text-status-error">{error}</p>}
        </div>
      )}

      {showInput && setting.inputType === "NUMERIC" && (
        <div>
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(null); }}
            onBlur={handleInputBlur}
            className="w-24 rounded border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hive-yellow"
          />
          {error && <p role="alert" className="mt-1 text-xs text-status-error">{error}</p>}
        </div>
      )}

      {showInput && (setting.inputType === "TEXT" || setting.inputType === "ALPHANUMERIC") && (
        <div>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => { setInputVal(e.target.value); setError(null); }}
            onBlur={handleInputBlur}
            className="w-full rounded border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hive-yellow"
          />
          {error && <p role="alert" className="mt-1 text-xs text-status-error">{error}</p>}
        </div>
      )}

      {isQrSetting && <QrCodeSection />}
    </div>
  );
}
