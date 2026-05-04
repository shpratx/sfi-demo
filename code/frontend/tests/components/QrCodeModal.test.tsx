import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import QrCodeModal from "@/pages/SettingsPage/components/QrCodeModal";

vi.mock("@/services/settingsApi", () => ({
  downloadQrPdf: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
}));

describe("QrCodeModal", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    blobUrl: "blob:http://localhost/test",
    orgName: "Acme Corp",
  };

  beforeEach(() => {
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders dialog with aria-modal true", () => {
    render(<QrCodeModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("shows org name in title", () => {
    render(<QrCodeModal {...defaultProps} />);
    expect(screen.getByText("Acme Corp — QR Code")).toBeInTheDocument();
  });

  it("closes on Escape key", async () => {
    const onClose = vi.fn();
    render(<QrCodeModal {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("Save as PDF button triggers download", async () => {
    const clickSpy = vi.fn();
    const createElementOrig = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string, options?: ElementCreationOptions) => {
      const el = createElementOrig(tag, options);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy });
      }
      return el;
    });

    render(<QrCodeModal {...defaultProps} />);
    await userEvent.click(screen.getByText("Save as PDF"));

    await vi.waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
