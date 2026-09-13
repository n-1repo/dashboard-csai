import type { MessageStatus, MessageType } from "@/types/database";
import type { MetaMessage } from "@/types/whatsapp";

const MEDIA_TYPES = ["image", "video", "audio", "document", "sticker"] as const;

export function mapMessageType(metaType: string): MessageType {
  switch (metaType) {
    case "text":
      return "TEXT";
    case "image":
      return "IMAGE";
    case "video":
      return "VIDEO";
    case "audio":
      return "AUDIO";
    case "document":
      return "DOCUMENT";
    case "sticker":
      return "STICKER";
    case "location":
      return "LOCATION";
    case "contacts":
      return "CONTACT";
    case "interactive":
    case "button":
      return "INTERACTIVE";
    case "template":
      return "TEMPLATE";
    case "system":
      return "SYSTEM";
    default:
      return "TEXT";
  }
}

export interface ParsedMessageContent {
  messageType: MessageType;
  body: string | null;
  mediaId: string | null;
  mediaMimeType: string | null;
  caption: string | null;
}

export function extractMessageContent(message: MetaMessage): ParsedMessageContent {
  const messageType = mapMessageType(message.type);

  if (message.type === "text") {
    return { messageType, body: message.text?.body ?? null, mediaId: null, mediaMimeType: null, caption: null };
  }

  if ((MEDIA_TYPES as readonly string[]).includes(message.type)) {
    const media = (message as unknown as Record<string, { id: string; mime_type: string; caption?: string }>)[
      message.type
    ];
    return {
      messageType,
      body: null,
      mediaId: media?.id ?? null,
      mediaMimeType: media?.mime_type ?? null,
      caption: media?.caption ?? null,
    };
  }

  if (message.type === "location" && message.location) {
    const { latitude, longitude, name, address } = message.location;
    const label = [name, address].filter(Boolean).join(", ");
    return {
      messageType,
      body: label ? `${label} (${latitude}, ${longitude})` : `${latitude}, ${longitude}`,
      mediaId: null,
      mediaMimeType: null,
      caption: null,
    };
  }

  if (message.type === "system") {
    return { messageType, body: message.system?.body ?? null, mediaId: null, mediaMimeType: null, caption: null };
  }

  return { messageType, body: null, mediaId: null, mediaMimeType: null, caption: null };
}

export function mapMetaStatus(status: string): MessageStatus {
  switch (status) {
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "read":
      return "READ";
    case "failed":
      return "FAILED";
    default:
      return "SENT";
  }
}
