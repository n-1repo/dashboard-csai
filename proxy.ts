import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import { APP_SESSION_COOKIE } from "@/lib/auth/session";

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!token) return false;

  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const isAuthed = await hasValidSession(req);
  if (isAuthed) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/contacts/:path*",
    "/api/conversations/:path*",
    "/api/messages/:path*",
    "/api/whatsapp/send",
    "/api/whatsapp/media/:path*",
    "/api/auth/session",
  ],
};
