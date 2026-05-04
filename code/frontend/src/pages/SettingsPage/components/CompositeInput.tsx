import { useState } from "react";

const DEFAULT_INSTRUCTION =
  "Due to earlier arrival time, please contact the traffic clerk at {TRAFFIC_CLERK_PHONE} for further instructions.";

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
    if (!state.hours) e.hours = "Hours is required";
    else if (!/^\d+$/.test(state.hours)) e.hours = "Digits only";
    if (!state.instruction) e.instruction = "Instruction is required";
    else if (state.instruction.length > 2000) e.instruction = "Max 2000 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleBlur() {
    if (validate()) {
      onSave(JSON.stringify({ hours: state.hours, instruction: state.instruction }));
    }
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">Composite setting</legend>
      <div>
        <label htmlFor="composite-hours" className="text-sm text-text-secondary">Hours</label>
        <input
          id="composite-hours"
          type="text"
          inputMode="numeric"
          aria-required="true"
          value={state.hours}
          onChange={(e) => setState((s) => ({ ...s, hours: e.target.value }))}
          onBlur={handleBlur}
          className="mt-1 block w-24 rounded border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hive-yellow"
        />
        {errors.hours && <p role="alert" className="mt-1 text-xs text-status-error">{errors.hours}</p>}
      </div>
      <div>
        <label htmlFor="composite-instruction" className="text-sm text-text-secondary">Driver Instructions</label>
        <textarea
          id="composite-instruction"
          aria-required="true"
          value={state.instruction}
          onChange={(e) => setState((s) => ({ ...s, instruction: e.target.value }))}
          onBlur={handleBlur}
          rows={3}
          className="mt-1 block w-full rounded border border-border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hive-yellow"
        />
        {errors.instruction && <p role="alert" className="mt-1 text-xs text-status-error">{errors.instruction}</p>}
      </div>
    </fieldset>
  );
}
