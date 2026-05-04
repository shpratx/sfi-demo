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

  if (!visible) return <span aria-live="polite" className="text-sm" />;

  return (
    <span aria-live="polite" className="text-sm">
      {status === "saving" && <span className="text-text-secondary">Saving…</span>}
      {status === "saved" && <span className="text-text-secondary">Saved</span>}
      {status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="text-status-error underline"
        >
          Error – Retry
        </button>
      )}
    </span>
  );
}
