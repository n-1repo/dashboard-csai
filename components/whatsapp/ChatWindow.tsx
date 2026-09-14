"use client";

import { useEffect, useState } from "react";

import { useMessages } from "@/hooks/useMessages";
import { useWindowStatus } from "@/hooks/useWindowStatus";
import { ChatHeader } from "@/components/whatsapp/ChatHeader";
import { MessageList } from "@/components/whatsapp/MessageList";
import { MessageComposer } from "@/components/whatsapp/MessageComposer";
import { ContactPanel } from "@/components/whatsapp/ContactPanel";
import type { Contact, ConversationWithContact } from "@/types/database";

interface ChatWindowProps {
  conversation: ConversationWithContact;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { messages, loading, error } = useMessages(conversation.id);
  const { status: windowStatus } = useWindowStatus(conversation.customer_window_expires_at);
  const [panelOpen, setPanelOpen] = useState(false);
  const [contact, setContact] = useState<Contact>(conversation.contact);

  useEffect(() => {
    if (conversation.unread_count > 0) {
      fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread_count: 0 }),
      });
    }
  }, [conversation.id, conversation.unread_count, messages.length]);

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader
        conversation={{ ...conversation, contact }}
        onOpenContactPanel={() => setPanelOpen(true)}
        onBack={onBack}
      />
      <MessageList messages={messages} loading={loading} error={error} />
      <MessageComposer conversationId={conversation.id} windowStatus={windowStatus} />

      <ContactPanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        contact={contact}
        conversation={conversation}
        onContactUpdated={setContact}
      />
    </div>
  );
}
