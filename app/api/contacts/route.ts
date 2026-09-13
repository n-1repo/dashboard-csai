import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const createSchema = z.object({
  phone_number: z.string().min(3),
  display_name: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const supabase = getSupabaseServerClient();

  let query = supabase.from("contacts").select("*").order("display_name", { ascending: true });

  if (q) {
    const escaped = q.replace(/[%,]/g, "");
    query = query.or(`display_name.ilike.%${escaped}%,phone_number.ilike.%${escaped}%`);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ contact: data }, { status: 201 });
}
