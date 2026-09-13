"use client";

import { useRef, useState } from "react";
import { Mic, Paperclip, Send, Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageComposerProps {
  conversationId: string;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, text: trimmed }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Gagal mengirim pesan");
      return;
    }

    setText("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border bg-panel-raised p-3">
      {error ? <div className="mb-2 text-xs text-destructive">{error}</div> : null}
      <div className="flex items-end gap-2">
        <Button variant="icon" size="icon" type="button" disabled>
          <Paperclip className="size-5" />
        </Button>
        <Button variant="icon" size="icon" type="button" disabled>
          <Smile className="size-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="max-h-32 min-h-9 flex-1 bg-panel-hover py-2"
        />

        {text.trim() ? (
          <Button size="icon" type="button" onClick={handleSend} disabled={sending}>
            <Send className="size-4" />
          </Button>
        ) : (
          <Button variant="icon" size="icon" type="button" disabled>
            <Mic className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
