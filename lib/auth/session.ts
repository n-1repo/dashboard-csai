import { SignJWT, jwtVerify } from "jose";

export const APP_SESSION_COOKIE = "wa_session";
const APP_SESSION_TTL_SECONDS = 8 * 60 * 60;
const SUPABASE_TOKEN_TTL_SECONDS = 60 * 60;

export interface AppSessionPayload {
  operatorId: string;
  email: string;
  displayName: string;
}

function getAppSessionSecretKey() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) throw new Error("APP_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function getSupabaseJwtSecretKey() {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signAppSessionToken(payload: AppSessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.operatorId)
    .setIssuedAt()
    .setExpirationTime(`${APP_SESSION_TTL_SECONDS}s`)
    .sign(getAppSessionSecretKey());
}

export async function verifyAppSessionToken(token: string): Promise<AppSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAppSessionSecretKey());
    if (typeof payload.operatorId !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      operatorId: payload.operatorId,
      email: payload.email,
      displayName: typeof payload.displayName === "string" ? payload.displayName : "",
    };
  } catch {
    return null;
  }
}

export async function signSupabaseRealtimeToken(operatorId: string) {
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(operatorId)
    .setIssuedAt()
    .setExpirationTime(`${SUPABASE_TOKEN_TTL_SECONDS}s`)
    .sign(getSupabaseJwtSecretKey());
}
