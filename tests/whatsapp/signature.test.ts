import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

import { isValidMetaSignature } from "@/lib/whatsapp/signature";

describe("isValidMetaSignature", () => {
  const secret = "test-app-secret";
  const body = JSON.stringify({ hello: "world" });
  const validHeader = `sha256=${crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex")}`;

  it("accepts a correctly signed body", () => {
    expect(isValidMetaSignature(body, validHeader, secret)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(isValidMetaSignature(body + "tampered", validHeader, secret)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(isValidMetaSignature(body, null, secret)).toBe(false);
  });

  it("rejects a wrong secret", () => {
    expect(isValidMetaSignature(body, validHeader, "wrong-secret")).toBe(false);
  });
});
