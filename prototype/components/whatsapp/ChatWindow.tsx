"use client";

import { useEffect, useState } from "react";

import { useMessages } from "@/hooks/useMessages";
import { ChatHeader } from "@/components/whatsapp/ChatHeader";
import { MessageList } from "@/components/whatsapp/MessageList";
import { MessageComposer } from "@/components/whatsapp/MessageComposer";
import { ContactPanel } from "@/components/whatsapp/ContactPanel";
import { useStore } from "@/lib/store";
import type { Contact, ConversationWithContact } from "@/types/database";

interface ChatWindowProps {
  conversation: ConversationWithContact;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { messages, loading, error } = useMessages(conversation.id);
  const { markConversationRead } = useStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [contact, setContact] = useState<Contact>(conversation.contact);

  useEffect(() => {
    if (conversation.unread_count > 0) {
      markConversationRead(conversation.id);
    }
  }, [conversation.id, conversation.unread_count, messages.length, markConversationRead]);

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader
        conversation={{ ...conversation, contact }}
        onOpenContactPanel={() => setPanelOpen(true)}
        onBack={onBack}
      />
      <MessageList messages={messages} loading={loading} error={error} />
      <MessageComposer conversationId={conversation.id} />

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
