import { useState } from "react";
import * as Switch from "@radix-ui/react-switch";
import type { Setting, UpdateSettingPayload } from "@/types";
import CompositeInput from "./CompositeInput";
import QrCodeSection from "./QrCodeSection";

const LABELS: Record<string, string> = {
  ORGANIZATION_NAME: "Organization Name",
  QR_CODE_ACCESS: "QR Code Check In Access",
  DRIVER_NAME: "Driver Name",
  DRIVER_ID: "Driver ID",
  DRIVER_PHONE_NUMBER: "Driver Phone Number",
  TRUCK_NUMBER: "Truck Number",
  CARRIER_APPROVAL_STEP: "Carrier Approval Step",
  TEMPERATURE_ACKNOWLEDGEMENT: "Temperature Acknowledgement Step",
  EARLY_CHECK_IN_STEP: "Early Check In Step",
  CONFIRMATION_STEP: "Confirmation Step",
};

const HELP: Record<string, string> = {
  ORGANIZATION_NAME: "Pre-populated from user login. Toggle always ON.",
  DRIVER_NAME: "Always required. Toggle always ON.",
  DRIVER_PHONE_NUMBER: "Always required. Toggle always ON.",
  TRUCK_NUMBER: "Always required. Toggle always ON.",
  DRIVER_ID: "Toggle active — can be disabled if not required.",
  CARRIER_APPROVAL_STEP: "Toggle active — disable to skip carrier approval during check-in.",
  TEMPERATURE_ACKNOWLEDGEMENT: "Add the temperature requirements to display during check-in via mobile app. Note: a temperature violation will not block the driver from completing check-in.",
  CONFIRMATION_STEP: "This message is displayed to the driver in the mobile app upon successful check-in completion.",
};

const VALIDATORS: Record<string, (v: string) => string | null> = {
  ALPHANUMERIC: (v) => {
    if (!v) return "A value is required";
    if (v.length > 200) return "Max 200 characters";
    if (!/^[a-zA-Z0-9\s\-°/]*$/.test(v)) return "Invalid format";
    return null;
  },
  NUMERIC: (v) => {
    if (!v) return "A value is required";
    if (!/^\d+$/.test(v)) return "Numbers only";
    if (Number(v) > 999) return "Max 999";
    return null;
  },
  TEXT: (v) => {
    if (!v) return "A value is required";
    if (v.length > 2000) return "Max 2000 characters";
    return null;
  },
  TEXTAREA: (v) => {
    if (!v) return "A value is required";
    if (v.length > 2000) return "Max 2000 characters";
    return null;
  },
};

const inputBase = "w-full h-[30px] rounded-[3px] border border-border-input px-2 text-xs text-text-primary mt-1 focus:outline-none focus:border-hive-yellow focus:shadow-[0_0_0_2px_rgba(245,197,24,0.2)]";
const textareaBase = "w-full h-16 rounded-[3px] border border-border-input px-2 py-[7px] text-xs text-text-primary mt-1 resize-y focus:outline-none focus:border-hive-yellow focus:shadow-[0_0_0_2px_rgba(245,197,24,0.2)]";

export default function SettingRow({
  setting,
  onUpdate,
}: {
  setting: Setting;
  onUpdate: (id: string, payload: UpdateSettingPayload) => void;
}) {
  const [inputVal, setInputVal] = useState(setting.inputValue ?? "");
  const [error, setError] = useState<string | null>(null);

  const label = LABELS[setting.settingName] ?? setting.settingName.replace(/_/g, " ");
  const help = HELP[setting.settingName];

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
  const isOrgName = setting.settingName === "ORGANIZATION_NAME";

  return (
    <div className="flex items-start gap-3.5 border-b border-border-light px-4 py-[13px] last:border-b-0">
      <div className="shrink-0 pt-0.5">
        <Switch.Root
          checked={setting.toggleState}
          onCheckedChange={handleToggle}
          disabled={setting.toggleLocked}
          aria-label={label + (setting.toggleLocked ? " — always on" : "")}
          className={`relative h-[22px] w-10 rounded-full transition-colors ${
            setting.toggleState ? "bg-hive-yellow" : "bg-border-input"
          } ${setting.toggleLocked ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
        >
          <Switch.Thumb className="block h-4 w-4 translate-x-[3px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform data-[state=checked]:translate-x-[21px]" />
        </Switch.Root>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-text-primary">{label}</div>

        {isOrgName && (
          <input
            type="text"
            value={inputVal}
            disabled
            className={`${inputBase} mt-1 bg-[#F5F5F5] text-[#888] cursor-not-allowed`}
          />
        )}

        {showInput && !isOrgName && setting.inputType === "COMPOSITE" && (
          <CompositeInput value={inputVal} onSave={handleCompositeBlur} />
        )}

        {showInput && !isOrgName && setting.inputType === "TEXTAREA" && (
          <div className="mt-1.5">
            {setting.settingName === "CONFIRMATION_STEP" && (
              <label className="text-[11px] font-semibold text-text-secondary">Successful Check In Confirmation Text:</label>
            )}
            <textarea
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); setError(null); }}
              onBlur={handleInputBlur}
              className={`${textareaBase}${error ? " border-[#D32F2F]" : ""}`}
            />
            {error && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#D32F2F]">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>
        )}

        {showInput && !isOrgName && setting.inputType === "NUMERIC" && (
          <div>
            <input
              type="text"
              inputMode="numeric"
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); setError(null); }}
              onBlur={handleInputBlur}
              className={`${inputBase} !w-[60px]${error ? " border-[#D32F2F]" : ""}`}
            />
            {error && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#D32F2F]">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>
        )}

        {showInput && !isOrgName && (setting.inputType === "TEXT" || setting.inputType === "ALPHANUMERIC") && (
          <div>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); setError(null); }}
              onBlur={handleInputBlur}
              className={`${inputBase}${error ? " border-[#D32F2F]" : ""}`}
            />
            {error && (
              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#D32F2F]">
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}
          </div>
        )}

        {isQrSetting && <QrCodeSection />}

        {help && (
          <p className="mt-1 text-[11px] italic leading-snug text-[#888]">{help}</p>
        )}
      </div>
    </div>
  );
}
