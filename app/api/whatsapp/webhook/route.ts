import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isValidMetaSignature } from "@/lib/whatsapp/signature";
import { extractMessageContent, mapMetaStatus } from "@/lib/whatsapp/webhook-parser";
import { shouldApplyStatus } from "@/lib/whatsapp/status-rank";
import { logMessageEvent } from "@/lib/whatsapp/events";
import { findOrCreateContact } from "@/lib/contacts/service";
import { findOrCreateConversation, touchConversationOnInbound } from "@/lib/conversations/service";
import type { MessageEventType, MessageStatus, WaAccount } from "@/types/database";
import type { MetaMessage, MetaStatus, MetaWebhookPayload } from "@/types/whatsapp";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

const STATUS_EVENT_TYPE: Record<MessageStatus, MessageEventType> = {
  RECEIVED: "MESSAGE_CREATED",
  SENT: "MESSAGE_SENT",
  DELIVERED: "MESSAGE_DELIVERED",
  READ: "MESSAGE_READ",
  FAILED: "MESSAGE_FAILED",
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !isValidMetaSignature(rawBody, req.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.metadata?.phone_number_id) continue;

      const { data: account } = await supabase
        .from("wa_accounts")
        .select("*")
        .eq("phone_number_id", value.metadata.phone_number_id)
        .maybeSingle<WaAccount>();

      if (!account) continue;

      for (const message of value.messages ?? []) {
        await processInboundMessage(supabase, account, value.metadata.display_phone_number, value.contacts, message);
      }

      for (const status of value.statuses ?? []) {
        await processStatusUpdate(supabase, status);
      }
    }
  }

  return NextResponse.json({ received: true });
}

async function processInboundMessage(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  account: WaAccount,
  displayPhoneNumber: string,
  contacts: MetaWebhookPayload["entry"][number]["changes"][number]["value"]["contacts"],
  message: MetaMessage,
) {
  const profileName = contacts?.find((c) => c.wa_id === message.from)?.profile.name ?? null;

  const { contact, created: contactCreated } = await findOrCreateContact(supabase, message.from, profileName);
  const conversation = await findOrCreateConversation(supabase, contact.id, account.id);
  const parsed = extractMessageContent(message);

  const { data: insertedMessage } = await supabase
    .from("messages")
    .upsert(
      {
        conversation_id: conversation.id,
        meta_message_id: message.id,
        direction: "INBOUND",
        message_type: parsed.messageType,
        body: parsed.body,
        media_url: parsed.mediaId,
        media_mime_type: parsed.mediaMimeType,
        caption: parsed.caption,
        status: "RECEIVED",
        sender_phone: message.from,
        recipient_phone: displayPhoneNumber,
        timestamp: new Date(Number(message.timestamp) * 1000).toISOString(),
        raw_payload: message,
      },
      { onConflict: "meta_message_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle<{ id: string }>();

  let messageId = insertedMessage?.id ?? null;
  const isNewMessage = Boolean(insertedMessage);

  if (!messageId) {
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .eq("meta_message_id", message.id)
      .maybeSingle<{ id: string }>();
    messageId = existing?.id ?? null;
  }

  await logMessageEvent(supabase, {
    messageId,
    contactId: contact.id,
    eventType: "WEBHOOK_RECEIVED",
    payload: message,
  });

  if (isNewMessage && messageId) {
    await logMessageEvent(supabase, { messageId, eventType: "MESSAGE_CREATED" });
    await touchConversationOnInbound(supabase, conversation.id, messageId, new Date(Number(message.timestamp) * 1000).toISOString());
  }

  if (contactCreated) {
    await logMessageEvent(supabase, {
      messageId,
      contactId: contact.id,
      eventType: "CONTACT_CREATED",
      payload: { phone_number: contact.phone_number },
    });
  }
}

async function processStatusUpdate(supabase: ReturnType<typeof getSupabaseServerClient>, status: MetaStatus) {
  const { data: existing } = await supabase
    .from("messages")
    .select("id, status")
    .eq("meta_message_id", status.id)
    .maybeSingle<{ id: string; status: MessageStatus }>();

  if (!existing) return;

  const newStatus = mapMetaStatus(status.status);

  await logMessageEvent(supabase, {
    messageId: existing.id,
    eventType: "WEBHOOK_RECEIVED",
    payload: status,
  });

  if (!shouldApplyStatus(existing.status, newStatus)) return;

  await supabase
    .from("messages")
    .update({ status: newStatus })
    .eq("id", existing.id)
    .eq("status", existing.status);

  await logMessageEvent(supabase, {
    messageId: existing.id,
    eventType: STATUS_EVENT_TYPE[newStatus],
    payload: status,
  });
}
