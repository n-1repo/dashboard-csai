import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { MessageEventType } from "@/types/database";

export async function logMessageEvent(
  supabase: SupabaseClient,
  event: {
    messageId?: string | null;
    contactId?: string | null;
    eventType: MessageEventType;
    payload?: unknown;
  },
) {
  await supabase.from("message_events").insert({
    message_id: event.messageId ?? null,
    contact_id: event.contactId ?? null,
    event_type: event.eventType,
    payload: event.payload ?? {},
  });
}
