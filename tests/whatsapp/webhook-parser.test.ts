import { describe, expect, it } from "vitest";

import {
  extractMessageContent,
  mapMessageType,
  mapMetaStatus,
  shouldResetCustomerWindow,
} from "@/lib/whatsapp/webhook-parser";
import type { MetaMessage } from "@/types/whatsapp";

describe("mapMessageType", () => {
  it("maps known Meta types to our enum", () => {
    expect(mapMessageType("text")).toBe("TEXT");
    expect(mapMessageType("image")).toBe("IMAGE");
    expect(mapMessageType("button")).toBe("INTERACTIVE");
    expect(mapMessageType("interactive")).toBe("INTERACTIVE");
  });

  it("falls back to TEXT for unknown types", () => {
    expect(mapMessageType("something_new")).toBe("TEXT");
  });
});

describe("extractMessageContent", () => {
  it("extracts text body", () => {
    const message: MetaMessage = {
      id: "wamid.1",
      from: "62811",
      timestamp: "1700000000",
      type: "text",
      text: { body: "hello" },
    };
    expect(extractMessageContent(message)).toEqual({
      messageType: "TEXT",
      body: "hello",
      mediaId: null,
      mediaMimeType: null,
      caption: null,
    });
  });

  it("extracts media id and caption", () => {
    const message: MetaMessage = {
      id: "wamid.2",
      from: "62811",
      timestamp: "1700000000",
      type: "image",
      image: { id: "media-123", mime_type: "image/jpeg", caption: "look" },
    };
    const result = extractMessageContent(message);
    expect(result.messageType).toBe("IMAGE");
    expect(result.mediaId).toBe("media-123");
    expect(result.mediaMimeType).toBe("image/jpeg");
    expect(result.caption).toBe("look");
  });

  it("formats location messages into a readable body", () => {
    const message: MetaMessage = {
      id: "wamid.3",
      from: "62811",
      timestamp: "1700000000",
      type: "location",
      location: { latitude: -6.2, longitude: 106.8, name: "Office" },
    };
    const result = extractMessageContent(message);
    expect(result.body).toContain("Office");
    expect(result.body).toContain("-6.2");
  });
});

describe("mapMetaStatus", () => {
  it("maps Meta status strings to our enum", () => {
    expect(mapMetaStatus("sent")).toBe("SENT");
    expect(mapMetaStatus("delivered")).toBe("DELIVERED");
    expect(mapMetaStatus("read")).toBe("READ");
    expect(mapMetaStatus("failed")).toBe("FAILED");
  });
});

describe("shouldResetCustomerWindow", () => {
  it("resets the window for a genuinely new inbound message", () => {
    expect(shouldResetCustomerWindow("INBOUND", true)).toBe(true);
  });

  it("does not reset the window for a redelivered (duplicate) inbound message", () => {
    expect(shouldResetCustomerWindow("INBOUND", false)).toBe(false);
  });

  it("never resets the window for an outbound message", () => {
    expect(shouldResetCustomerWindow("OUTBOUND", true)).toBe(false);
    expect(shouldResetCustomerWindow("OUTBOUND", false)).toBe(false);
  });
});
