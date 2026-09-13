import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  status: z.enum(["OPEN", "PENDING", "RESOLVED", "ARCHIVED"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  unread_count: z.number().int().min(0).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*), last_message:messages!conversations_last_message_id_fkey(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ conversation: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("conversations")
    .update(parsed.data)
    .eq("id", id)
    .select("*, contact:contacts(*), last_message:messages!conversations_last_message_id_fkey(*)")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ conversation: data });
}
