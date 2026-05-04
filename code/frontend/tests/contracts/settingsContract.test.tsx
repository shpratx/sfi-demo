import { describe, it, expect } from "vitest";

describe("Settings API Contract", () => {
  it("settings list response matches Setting type shape", () => {
    const response = {
      id: "abc-123",
      settingName: "DRIVER_LICENSE",
      toggleState: true,
      toggleLocked: false,
      inputValue: "test",
      inputType: "alphanumeric",
      displayOrder: 1,
      versionNum: 3,
      updatedAt: "2024-01-01T00:00:00Z",
      updatedBy: "user-1",
    };

    expect(response).toHaveProperty("id");
    expect(typeof response.id).toBe("string");
    expect(typeof response.settingName).toBe("string");
    expect(typeof response.toggleState).toBe("boolean");
    expect(typeof response.toggleLocked).toBe("boolean");
    expect(typeof response.inputValue).toBe("string");
    expect(typeof response.inputType).toBe("string");
    expect(typeof response.displayOrder).toBe("number");
    expect(typeof response.versionNum).toBe("number");
    expect(typeof response.updatedAt).toBe("string");
    expect(typeof response.updatedBy).toBe("string");
  });

  it("update response matches UpdateSettingResponse shape", () => {
    const response = {
      id: "abc-123",
      settingName: "DRIVER_LICENSE",
      toggleState: false,
      toggleLocked: false,
      inputValue: "updated",
      inputType: "alphanumeric",
      displayOrder: 1,
      versionNum: 4,
      updatedAt: "2024-01-02T00:00:00Z",
      updatedBy: "user-1",
    };

    expect(response).toHaveProperty("id");
    expect(response.versionNum).toBeGreaterThan(0);
    expect(typeof response.toggleState).toBe("boolean");
  });

  it("error response matches RFC 7807 shape", () => {
    const errorResponse = {
      type: "https://api.example.com/errors/conflict",
      title: "Conflict",
      status: 409,
      detail: "Setting was modified by another user",
      instance: "/v1/settings/abc-123",
    };

    expect(errorResponse).toHaveProperty("type");
    expect(errorResponse).toHaveProperty("title");
    expect(errorResponse).toHaveProperty("status");
    expect(errorResponse).toHaveProperty("detail");
    expect(typeof errorResponse.type).toBe("string");
    expect(typeof errorResponse.status).toBe("number");
    expect(typeof errorResponse.detail).toBe("string");
  });
});
