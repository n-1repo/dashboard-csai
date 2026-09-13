import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { verifyPassword } from "@/lib/auth/password";
import { APP_SESSION_COOKIE, signAppSessionToken } from "@/lib/auth/session";
import type { Operator } from "@/types/database";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: operator, error } = await supabase
    .from("operators")
    .select("id, email, password_hash, display_name")
    .eq("email", parsed.data.email.toLowerCase())
    .maybeSingle<Pick<Operator, "id" | "email" | "password_hash" | "display_name">>();

  if (error || !operator) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, operator.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signAppSessionToken({
    operatorId: operator.id,
    email: operator.email,
    displayName: operator.display_name,
  });

  const response = NextResponse.json({
    operator: { id: operator.id, email: operator.email, displayName: operator.display_name },
  });

  response.cookies.set(APP_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return response;
}
