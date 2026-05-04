import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/services/authApi", () => ({
  login: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

import { login } from "@/services/authApi";
import LoginPage from "@/pages/LoginPage";

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    renderLogin();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("shows validation error for empty email", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });
  });

  it("calls login API on valid submit", async () => {
    vi.mocked(login).mockResolvedValue({
      accessToken: "tok",
      user: { id: "1", fullName: "Test", role: "ADMIN", org_id: "org-1" },
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("test@example.com", "pass123");
    });
  });
});
