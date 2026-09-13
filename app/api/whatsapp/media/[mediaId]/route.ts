import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { downloadMedia, MetaApiError } from "@/lib/whatsapp/client";
import type { WaAccount } from "@/types/database";

export async function GET(req: NextRequest, { params }: { params: Promise<{ mediaId: string }> }) {
  const { mediaId } = await params;

  const supabase = getSupabaseServerClient();
  const { data: account } = await supabase
    .from("wa_accounts")
    .select("*")
    .eq("status", "ACTIVE")
    .limit(1)
    .maybeSingle<WaAccount>();

  if (!account) {
    return NextResponse.json({ error: "No active WhatsApp account configured" }, { status: 404 });
  }

  try {
    const { body, contentType } = await downloadMedia(mediaId, account.access_token);
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const status = err instanceof MetaApiError ? err.status : 502;
    return NextResponse.json({ error: "Failed to fetch media" }, { status });
  }
}
