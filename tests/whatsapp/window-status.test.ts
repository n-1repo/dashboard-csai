import { describe, expect, it } from "vitest";

import { getWindowStatus } from "@/lib/whatsapp/window-status";

describe("getWindowStatus", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  it("returns NONE when there is no expiry", () => {
    expect(getWindowStatus(null, now)).toBe("NONE");
  });

  it("returns ACTIVE when more than 4h remain", () => {
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000 + 1000).toISOString();
    expect(getWindowStatus(expiresAt, now)).toBe("ACTIVE");
  });

  it("returns EXPIRING at exactly 4h remaining (inclusive boundary)", () => {
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    expect(getWindowStatus(expiresAt, now)).toBe("EXPIRING");
  });

  it("returns EXPIRING when less than 4h remain", () => {
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    expect(getWindowStatus(expiresAt, now)).toBe("EXPIRING");
  });

  it("returns EXPIRED once remaining time reaches zero or below", () => {
    expect(getWindowStatus(now.toISOString(), now)).toBe("EXPIRED");
    expect(getWindowStatus(new Date(now.getTime() - 1000).toISOString(), now)).toBe("EXPIRED");
  });
});
