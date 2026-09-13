import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get("conversation_id");
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 50;

  if (!conversationId) {
    return NextResponse.json({ error: "conversation_id is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("timestamp", cursor);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const messages = (data ?? []).slice().reverse();
  const nextCursor = data && data.length === limit ? messages[0]?.timestamp ?? null : null;

  return NextResponse.json({ messages, nextCursor });
}
