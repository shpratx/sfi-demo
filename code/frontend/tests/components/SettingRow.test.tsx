import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import SettingRow from "@/pages/SettingsPage/components/SettingRow";
import type { Setting } from "@/types";

vi.mock("@/hooks/useSettings", () => ({
  useGenerateQr: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { fullName: "Test" } }),
}));

const baseSetting: Setting = {
  id: "1",
  settingName: "TEST_SETTING",
  toggleState: true,
  toggleLocked: false,
  inputValue: "abc",
  inputType: "ALPHANUMERIC",
  displayOrder: 1,
  versionNum: 3,
  updatedAt: "2024-01-01",
  updatedBy: "user1",
};

describe("SettingRow", () => {
  it("renders toggle with correct aria-checked state", () => {
    render(<SettingRow setting={baseSetting} onUpdate={vi.fn()} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("locked toggle has aria-disabled", () => {
    render(<SettingRow setting={{ ...baseSetting, toggleLocked: true }} onUpdate={vi.fn()} />);
    expect(screen.getByRole("switch")).toBeDisabled();
  });

  it("shows input when toggleState is true and inputType exists", () => {
    render(<SettingRow setting={baseSetting} onUpdate={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("hides input when toggleState is false", () => {
    render(<SettingRow setting={{ ...baseSetting, toggleState: false }} onUpdate={vi.fn()} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("calls onUpdate on input blur with value and versionNum", async () => {
    const onUpdate = vi.fn();
    render(<SettingRow setting={baseSetting} onUpdate={onUpdate} />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "xyz");
    await userEvent.tab();
    expect(onUpdate).toHaveBeenCalledWith("1", { inputValue: "xyz", versionNum: 3 });
  });

  it("shows error message for invalid alphanumeric input", async () => {
    render(<SettingRow setting={baseSetting} onUpdate={vi.fn()} />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "abc!@#");
    await userEvent.tab();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows 'A value is required' for empty required field", async () => {
    render(<SettingRow setting={baseSetting} onUpdate={vi.fn()} />);
    const input = screen.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.tab();
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });
});
