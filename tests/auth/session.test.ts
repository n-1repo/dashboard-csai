import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.APP_SESSION_SECRET = "test-app-session-secret-value";
  process.env.SUPABASE_JWT_SECRET = "test-supabase-jwt-secret-value";
});

describe("session tokens", () => {
  it("signs and verifies an app session token round-trip", async () => {
    const { signAppSessionToken, verifyAppSessionToken } = await import("@/lib/auth/session");

    const token = await signAppSessionToken({
      operatorId: "op-1",
      email: "operator@example.com",
      displayName: "Dev Operator",
    });

    const payload = await verifyAppSessionToken(token);
    expect(payload).toEqual({
      operatorId: "op-1",
      email: "operator@example.com",
      displayName: "Dev Operator",
    });
  });

  it("rejects a tampered token", async () => {
    const { signAppSessionToken, verifyAppSessionToken } = await import("@/lib/auth/session");

    const token = await signAppSessionToken({
      operatorId: "op-1",
      email: "operator@example.com",
      displayName: "Dev Operator",
    });

    const payload = await verifyAppSessionToken(`${token}tampered`);
    expect(payload).toBeNull();
  });

  it("mints a Supabase-compatible realtime token with the authenticated role", async () => {
    const { signSupabaseRealtimeToken } = await import("@/lib/auth/session");
    const { jwtVerify } = await import("jose");

    const token = await signSupabaseRealtimeToken("op-1");
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET),
    );

    expect(payload.sub).toBe("op-1");
    expect(payload.role).toBe("authenticated");
  });
});
