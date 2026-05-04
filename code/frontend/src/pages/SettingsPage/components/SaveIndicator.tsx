import { useEffect, useState } from "react";

type Status = "idle" | "saving" | "saved" | "error";

export default function SaveIndicator({
  status,
  onRetry,
}: {
  status: Status;
  onRetry?: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "idle") return;
    setVisible(true);
    if (status === "saved") {
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (!visible) {
    return <span aria-live="polite" className="text-[11px] italic text-[#888]">Changes auto-saved on focus out</span>;
  }

  return (
    <span aria-live="polite" className="text-[11px] italic">
      {status === "saving" && <span className="text-[#888]">Saving…</span>}
      {status === "saved" && <span className="text-[#888]">✓ Saved</span>}
      {status === "error" && (
        <button type="button" onClick={onRetry} className="text-[#D32F2F] underline">
          Error – Retry
        </button>
      )}
    </span>
  );
}
