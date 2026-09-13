import { NextRequest, NextResponse } from "next/server";

import { APP_SESSION_COOKIE, signSupabaseRealtimeToken, verifyAppSessionToken } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(APP_SESSION_COOKIE)?.value;
  const session = token ? await verifyAppSessionToken(token) : null;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const realtimeToken = await signSupabaseRealtimeToken(session.operatorId);

  return NextResponse.json({
    operator: { id: session.operatorId, email: session.email, displayName: session.displayName },
    realtimeToken,
  });
}
