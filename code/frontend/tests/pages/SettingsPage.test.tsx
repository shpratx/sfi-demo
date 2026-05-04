import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Setting } from "@/types";

const mockSettings: Setting[] = [
  { id: "1", settingName: "DRIVER_LICENSE", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 1, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "2", settingName: "DRIVER_PHOTO", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 2, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "3", settingName: "DRIVER_SIGNATURE", toggleState: false, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 3, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "4", settingName: "QR_CODE_ACCESS", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 4, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "5", settingName: "SETTING_5", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 5, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "6", settingName: "SETTING_6", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 6, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "7", settingName: "SETTING_7", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 7, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "8", settingName: "SETTING_8", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 8, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "9", settingName: "SETTING_9", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 9, versionNum: 1, updatedAt: "", updatedBy: "" },
  { id: "10", settingName: "SETTING_10", toggleState: true, toggleLocked: false, inputValue: "", inputType: "", displayOrder: 10, versionNum: 1, updatedAt: "", updatedBy: "" },
];

let mockUseSettings: ReturnType<typeof vi.fn>;

vi.mock("@/hooks/useSettings", () => ({
  useSettings: () => mockUseSettings(),
  useUpdateSetting: () => ({ mutate: vi.fn(), variables: null }),
  useGenerateQr: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { fullName: "Test" } }),
}));

import SettingsPage from "@/pages/SettingsPage";

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton initially", () => {
    mockUseSettings = vi.fn(() => ({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() }));
    renderWithQuery(<SettingsPage />);
    expect(screen.getByText("Driver Check In Admin")).toBeInTheDocument();
    // Skeleton has animate-pulse class
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders all 10 settings after data loads", () => {
    mockUseSettings = vi.fn(() => ({ data: mockSettings, isLoading: false, isError: false, refetch: vi.fn() }));
    renderWithQuery(<SettingsPage />);
    expect(screen.getAllByRole("switch")).toHaveLength(10);
  });

  it("groups identity settings under Driver Identity heading", () => {
    mockUseSettings = vi.fn(() => ({ data: mockSettings, isLoading: false, isError: false, refetch: vi.fn() }));
    renderWithQuery(<SettingsPage />);
    expect(screen.getByText("Driver Identity")).toBeInTheDocument();
  });

  it("shows QR section when QR_CODE_ACCESS is ON", () => {
    mockUseSettings = vi.fn(() => ({ data: mockSettings, isLoading: false, isError: false, refetch: vi.fn() }));
    renderWithQuery(<SettingsPage />);
    expect(screen.getByText("Generate QR Code")).toBeInTheDocument();
  });
});
