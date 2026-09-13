"use client";

import { AlertCircle, Check, CheckCheck, Clock, FileText } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Message } from "@/types/database";

const TYPE_LABELS: Partial<Record<Message["message_type"], string>> = {
  LOCATION: "Location",
  CONTACT: "Contact card",
  INTERACTIVE: "Interactive message",
  TEMPLATE: "Template message",
  SYSTEM: "System message",
};

function StatusIcon({ status }: { status: Message["status"] }) {
  if (status === "FAILED") return <AlertCircle className="size-3.5 text-status-failed" />;
  if (status === "READ") return <CheckCheck className="size-3.5 text-status-read" />;
  if (status === "DELIVERED") return <CheckCheck className="size-3.5 text-status-delivered" />;
  if (status === "SENT") return <Check className="size-3.5 text-status-sent" />;
  return <Clock className="size-3.5 text-muted-foreground" />;
}

function MessageContent({ message }: { message: Message }) {
  const mediaSrc = message.media_url ? `/api/whatsapp/media/${message.media_url}` : null;

  if (message.message_type === "IMAGE" && mediaSrc) {
    return (
      <div className="flex flex-col gap-1">
        <img src={mediaSrc} alt="" className="max-w-[260px] rounded-lg" />
        {message.caption ? <span>{message.caption}</span> : null}
      </div>
    );
  }

  if (message.message_type === "STICKER" && mediaSrc) {
    return <img src={mediaSrc} alt="" className="max-w-[120px]" />;
  }

  if (message.message_type === "VIDEO" && mediaSrc) {
    return (
      <div className="flex flex-col gap-1">
        <video controls src={mediaSrc} className="max-w-[260px] rounded-lg" />
        {message.caption ? <span>{message.caption}</span> : null}
      </div>
    );
  }

  if (message.message_type === "AUDIO" && mediaSrc) {
    return <audio controls src={mediaSrc} className="max-w-[260px]" />;
  }

  if (message.message_type === "DOCUMENT" && mediaSrc) {
    return (
      <a href={mediaSrc} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
        <FileText className="size-4 shrink-0" />
        {message.caption || "Document"}
      </a>
    );
  }

  if (message.message_type === "TEXT") {
    return <span className="whitespace-pre-wrap break-words">{message.body}</span>;
  }

  if (message.body) {
    return <span className="whitespace-pre-wrap break-words">{message.body}</span>;
  }

  return <span className="italic opacity-70">{TYPE_LABELS[message.message_type] ?? "Message"}</span>;
}

export function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "OUTBOUND";
  const time = new Date(message.timestamp).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1 rounded-lg px-2 py-1.5 text-sm shadow-sm",
          isOutbound ? "bg-bubble-out text-bubble-out-foreground" : "bg-bubble-in text-bubble-in-foreground",
          message.status === "FAILED" && "ring-1 ring-status-failed",
        )}
      >
        <MessageContent message={message} />
        <span
          className={cn(
            "flex items-center gap-1 self-end text-[11px]",
            isOutbound ? "text-bubble-meta-out" : "text-bubble-meta",
          )}
        >
          {time}
          {isOutbound ? <StatusIcon status={message.status} /> : null}
        </span>
      </div>
    </div>
  );
}
