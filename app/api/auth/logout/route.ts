import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(APP_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
