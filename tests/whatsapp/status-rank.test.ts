import { describe, expect, it } from "vitest";

import { shouldApplyStatus } from "@/lib/whatsapp/status-rank";

describe("shouldApplyStatus", () => {
  it("allows forward progress", () => {
    expect(shouldApplyStatus("SENT", "DELIVERED")).toBe(true);
    expect(shouldApplyStatus("DELIVERED", "READ")).toBe(true);
    expect(shouldApplyStatus("RECEIVED", "SENT")).toBe(true);
  });

  it("rejects duplicate or out-of-order redeliveries", () => {
    expect(shouldApplyStatus("READ", "DELIVERED")).toBe(false);
    expect(shouldApplyStatus("DELIVERED", "SENT")).toBe(false);
    expect(shouldApplyStatus("SENT", "SENT")).toBe(false);
  });

  it("allows FAILED from any non-terminal state", () => {
    expect(shouldApplyStatus("SENT", "FAILED")).toBe(true);
    expect(shouldApplyStatus("DELIVERED", "FAILED")).toBe(true);
  });

  it("treats FAILED as terminal", () => {
    expect(shouldApplyStatus("FAILED", "SENT")).toBe(false);
    expect(shouldApplyStatus("FAILED", "DELIVERED")).toBe(false);
    expect(shouldApplyStatus("FAILED", "FAILED")).toBe(false);
  });
});
