"use client";

import { useEffect, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { MessageBubble } from "@/components/whatsapp/MessageBubble";
import { DateSeparator } from "@/components/whatsapp/DateSeparator";
import type { Message } from "@/types/database";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export function MessageList({ messages, loading, error }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col justify-end gap-3 p-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={i % 2 === 0 ? "h-10 w-1/2" : "ml-auto h-10 w-1/2"} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-5 text-sm text-destructive">{error}</div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-5 text-sm text-muted-foreground">
        Belum ada pesan di percakapan ini
      </div>
    );
  }

  const rows = messages.reduce<{ message: Message; showSeparator: boolean }[]>((acc, message) => {
    const messageDate = new Date(message.timestamp).toDateString();
    const previousDate = acc.length ? new Date(acc[acc.length - 1].message.timestamp).toDateString() : null;
    acc.push({ message, showSeparator: messageDate !== previousDate });
    return acc;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="flex flex-col gap-1">
        {rows.map(({ message, showSeparator }) => (
          <div key={message.id}>
            {showSeparator ? <DateSeparator date={message.timestamp} /> : null}
            <MessageBubble message={message} />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
