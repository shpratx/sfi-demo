import * as Dialog from "@radix-ui/react-dialog";
import { downloadQrPdf } from "@/services/settingsApi";

export default function QrCodeModal({
  open,
  onClose,
  blobUrl,
  orgName,
}: {
  open: boolean;
  onClose: () => void;
  blobUrl: string;
  orgName: string;
}) {
  async function handleSavePdf() {
    const blob = await downloadQrPdf();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/55" />
        <Dialog.Content
          aria-modal="true"
          aria-labelledby="qr-title"
          className="fixed left-1/2 top-1/2 w-[360px] -translate-x-1/2 -translate-y-1/2 rounded border-t-[3px] border-hive-yellow bg-bg-surface p-6 text-center shadow-lg focus:outline-none"
        >
          <Dialog.Title id="qr-title" className="mb-4 text-sm font-bold leading-snug text-text-primary">
            QR Code for {orgName}
            <br />
            Driver Check In Access
          </Dialog.Title>

          <div className="mx-auto mb-4 flex h-[190px] w-[190px] items-center justify-center rounded border border-border-light bg-[#F5F5F5]">
            {blobUrl && (
              <img
                src={blobUrl}
                alt={`QR code for driver check-in at ${orgName}`}
                className="max-h-[170px] max-w-[170px]"
              />
            )}
          </div>

          <p className="mb-4 text-[11px] leading-snug text-text-secondary">
            Scan this QR code to access Driver Check In for this facility.
          </p>

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleSavePdf}
              className="inline-flex items-center gap-1.5 rounded bg-hive-yellow px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-hive-yellow-dark"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Save as PDF
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2a2a2a]"
            >
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print
            </button>
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded border border-border-input bg-transparent px-3.5 py-2 text-xs font-semibold text-text-secondary hover:border-[#999] hover:text-text-primary"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Close
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
