import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Conversation } from "@/types/database";

export async function findOrCreateConversation(
  supabase: SupabaseClient,
  contactId: string,
  waAccountId: string,
): Promise<Conversation> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("contact_id", contactId)
    .eq("wa_account_id", waAccountId)
    .maybeSingle<Conversation>();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ contact_id: contactId, wa_account_id: waAccountId })
    .select("*")
    .single<Conversation>();

  if (error || !created) {
    throw new Error(`Failed to create conversation: ${error?.message}`);
  }

  return created;
}

export async function touchConversationOnInbound(
  supabase: SupabaseClient,
  conversationId: string,
  messageId: string,
  timestamp: string,
) {
  await supabase.rpc("increment_conversation_unread", {
    p_conversation_id: conversationId,
    p_message_id: messageId,
    p_timestamp: timestamp,
  });
}

export async function touchConversationOnOutbound(
  supabase: SupabaseClient,
  conversationId: string,
  messageId: string,
  timestamp: string,
) {
  await supabase
    .from("conversations")
    .update({ last_message_id: messageId, last_message_at: timestamp })
    .eq("id", conversationId);
}
