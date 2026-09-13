import type { Message, MessageType } from "@/types/database";

export function formatTimestamp(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: isThisYear ? undefined : "numeric",
  });
}

export function formatDateSeparator(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

const MEDIA_LABELS: Partial<Record<MessageType, string>> = {
  IMAGE: "Photo",
  VIDEO: "Video",
  AUDIO: "Audio",
  DOCUMENT: "Document",
  STICKER: "Sticker",
  LOCATION: "Location",
  CONTACT: "Contact",
  INTERACTIVE: "Interactive message",
  TEMPLATE: "Template message",
  SYSTEM: "System message",
};

export function messagePreview(message: Pick<Message, "message_type" | "body" | "direction"> | null) {
  if (!message) return "Belum ada pesan";
  const prefix = message.direction === "OUTBOUND" ? "Anda: " : "";
  if (message.message_type === "TEXT") {
    return `${prefix}${message.body ?? ""}`;
  }
  return `${prefix}${MEDIA_LABELS[message.message_type] ?? "Pesan"}`;
}

export function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
