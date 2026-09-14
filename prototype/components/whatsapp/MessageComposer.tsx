"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Mic, Paperclip, Send, Smile } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { WindowStatus } from "@/lib/window-status";

interface MessageComposerProps {
  conversationId: string;
  windowStatus: WindowStatus;
}

export function MessageComposer({ conversationId, windowStatus }: MessageComposerProps) {
  const { sendMessage } = useStore();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (windowStatus === "EXPIRED") {
    return (
      <div className="border-t border-border bg-panel-raised p-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium text-status-failed">
          <AlertTriangle className="size-4" />
          Customer messaging window has expired.
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Use an approved template to continue the conversation.
        </p>
      </div>
    );
  }

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;

    sendMessage(conversationId, trimmed);
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
      {windowStatus === "EXPIRING" ? (
        <div className="mb-2 text-xs text-status-expiring">
          Customer window closing soon — reply now or switch to a template after it expires.
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <Button
          variant="icon"
          size="icon"
          type="button"
          disabled
          aria-label="Attach file"
          title="Attach file (coming soon)"
        >
          <Paperclip className="size-5" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          type="button"
          disabled
          aria-label="Emoji picker"
          title="Emoji picker (coming soon)"
        >
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
          <Button size="icon" type="button" onClick={handleSend} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        ) : (
          <Button
            variant="icon"
            size="icon"
            type="button"
            disabled
            aria-label="Voice message"
            title="Voice message (coming soon)"
          >
            <Mic className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
