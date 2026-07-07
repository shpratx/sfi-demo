import { useState } from "react";
import { useGenerateQr, useSettings } from "@/hooks/useSettings";
import QrCodeModal from "./QrCodeModal";

export default function QrCodeSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const { data: settings } = useSettings();
  const generateQr = useGenerateQr();

  const orgName = settings?.find((s) => s.settingName === "ORGANIZATION_NAME")?.inputValue ?? "Organization";

  function handleGenerate() {
    generateQr.mutate(undefined, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setModalOpen(true);
      },
    });
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={generateQr.isPending}
        className="inline-flex items-center gap-1.5 rounded-[3px] bg-ims-yellow px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-ims-yellow-dark disabled:opacity-50"
      >
        {generateQr.isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-text-primary border-t-transparent" />
            Generating…
          </span>
        ) : (
          <>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h3M17 14h3M17 17v4M20 14v.01"/></svg>
            Generate QR Code
          </>
        )}
      </button>
      <QrCodeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (blobUrl) URL.revokeObjectURL(blobUrl);
        }}
        blobUrl={blobUrl}
        orgName={orgName}
      />
    </div>
  );
}
