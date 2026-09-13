import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MetaApiError, sendTextMessage } from "@/lib/whatsapp/client";
import { logMessageEvent } from "@/lib/whatsapp/events";
import { touchConversationOnOutbound } from "@/lib/conversations/service";
import type { Contact, Conversation, WaAccount } from "@/types/database";

const sendSchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().min(1).max(4096),
});

type ConversationWithRelations = Conversation & {
  contact: Contact;
  wa_account: WaAccount;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*), wa_account:wa_accounts(*)")
    .eq("id", parsed.data.conversationId)
    .maybeSingle<ConversationWithRelations>();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  try {
    const response = await sendTextMessage(
      conversation.wa_account.phone_number_id,
      conversation.wa_account.access_token,
      conversation.contact.phone_number,
      parsed.data.text,
    );

    const metaMessageId = response.messages?.[0]?.id ?? null;

    const { data: message } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        meta_message_id: metaMessageId,
        direction: "OUTBOUND",
        message_type: "TEXT",
        body: parsed.data.text,
        status: "SENT",
        sender_phone: conversation.wa_account.phone_number,
        recipient_phone: conversation.contact.phone_number,
        timestamp: now,
        raw_payload: response,
      })
      .select("*")
      .single();

    if (!message) {
      throw new Error("Failed to persist outbound message");
    }

    await logMessageEvent(supabase, { messageId: message.id, eventType: "MESSAGE_CREATED" });
    await logMessageEvent(supabase, { messageId: message.id, eventType: "MESSAGE_SENT", payload: response });
    await touchConversationOnOutbound(supabase, conversation.id, message.id, now);

    return NextResponse.json({ message });
  } catch (err) {
    const status = err instanceof MetaApiError ? err.status : 502;
    const errorMessage = err instanceof Error ? err.message : "Failed to send message";

    const { data: message } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        meta_message_id: null,
        direction: "OUTBOUND",
        message_type: "TEXT",
        body: parsed.data.text,
        status: "FAILED",
        sender_phone: conversation.wa_account.phone_number,
        recipient_phone: conversation.contact.phone_number,
        timestamp: now,
        raw_payload: { error: errorMessage },
      })
      .select("*")
      .single();

    if (message) {
      await logMessageEvent(supabase, {
        messageId: message.id,
        eventType: "MESSAGE_FAILED",
        payload: { error: errorMessage },
      });
      await touchConversationOnOutbound(supabase, conversation.id, message.id, now);
    }

    return NextResponse.json({ message, error: errorMessage }, { status });
  }
}
