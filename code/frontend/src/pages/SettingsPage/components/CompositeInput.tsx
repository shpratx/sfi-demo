import { useState } from "react";

const DEFAULT_INSTRUCTION =
  "Due to earlier arrival time, you cannot check in via regular process. Please contact Facility Administrator directly via phone number {TRAFFIC_CLERK_PHONE}";

interface CompositeValue {
  hours: string;
  instruction: string;
}

function parse(val: string): CompositeValue {
  try {
    const parsed = JSON.parse(val) as CompositeValue;
    return { hours: parsed.hours ?? "", instruction: parsed.instruction ?? DEFAULT_INSTRUCTION };
  } catch {
    return { hours: "", instruction: DEFAULT_INSTRUCTION };
  }
}

const inputCls = "h-[30px] rounded-[3px] border border-border-input px-2 text-xs text-text-primary focus:outline-none focus:border-ims-yellow focus:shadow-[0_0_0_2px_rgba(245,197,24,0.2)]";
const textareaCls = "w-full h-16 rounded-[3px] border border-border-input px-2 py-[7px] text-xs text-text-primary resize-y focus:outline-none focus:border-ims-yellow focus:shadow-[0_0_0_2px_rgba(245,197,24,0.2)]";

export default function CompositeInput({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => void;
}) {
  const [state, setState] = useState(() => parse(value));
  const [errors, setErrors] = useState<{ hours?: string; instruction?: string }>({});

  function validate(): boolean {
    const e: typeof errors = {};
    if (!state.hours) e.hours = "A value is required";
    else if (!/^\d+$/.test(state.hours)) e.hours = "Numbers only";
    if (!state.instruction) e.instruction = "A value is required";
    else if (state.instruction.length > 2000) e.instruction = "Max 2000 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleBlur() {
    if (validate()) {
      onSave(JSON.stringify({ hours: state.hours, instruction: state.instruction }));
    }
  }

  const errIcon = (
    <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );

  return (
    <fieldset className="mt-1.5 flex flex-col gap-2">
      <legend className="sr-only">Early Check In configuration</legend>
      <div className="flex items-center gap-2">
        <label htmlFor="composite-hours" className="shrink-0 text-[11px] text-text-secondary">Allowed Early Hours:</label>
        <div>
          <input
            id="composite-hours"
            type="text"
            inputMode="numeric"
            aria-required="true"
            value={state.hours}
            onChange={(e) => setState((s) => ({ ...s, hours: e.target.value }))}
            onBlur={handleBlur}
            className={`${inputCls} w-[60px]${errors.hours ? " border-[#D32F2F]" : ""}`}
          />
          {errors.hours && (
            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#D32F2F]">{errIcon}{errors.hours}</div>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="composite-instruction" className="text-[11px] font-semibold text-text-secondary">Early Check In Instruction:</label>
        <textarea
          id="composite-instruction"
          aria-required="true"
          value={state.instruction}
          onChange={(e) => setState((s) => ({ ...s, instruction: e.target.value }))}
          onBlur={handleBlur}
          className={`${textareaCls}${errors.instruction ? " border-[#D32F2F]" : ""}`}
        />
        {errors.instruction && (
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[#D32F2F]">{errIcon}{errors.instruction}</div>
        )}
      </div>
    </fieldset>
  );
}
