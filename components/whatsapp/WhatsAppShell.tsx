"use client";

import { useMemo, useState } from "react";

import { useRealtimeAuth } from "@/hooks/useRealtimeAuth";
import { useConversations } from "@/hooks/useConversations";
import { Sidebar } from "@/components/whatsapp/Sidebar";
import { ConversationList } from "@/components/whatsapp/ConversationList";
import { ChatWindow } from "@/components/whatsapp/ChatWindow";
import { EmptyChat } from "@/components/whatsapp/EmptyChat";
import { FollowUpCenter } from "@/components/whatsapp/FollowUpCenter";
import { getWindowStatus } from "@/lib/whatsapp/window-status";
import { cn } from "@/lib/utils";

export function WhatsAppShell() {
  const { operator } = useRealtimeAuth();
  const { conversations, loading, error } = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [followUpsOpen, setFollowUpsOpen] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations],
  );

  const followUps = useMemo(
    () =>
      conversations
        .filter((c) => c.status === "OPEN" && getWindowStatus(c.customer_window_expires_at) === "EXPIRING")
        .sort((a, b) => new Date(a.customer_window_expires_at!).getTime() - new Date(b.customer_window_expires_at!).getTime()),
    [conversations],
  );

  return (
    <>
      <Sidebar
        operator={operator}
        unreadTotal={unreadTotal}
        followUpCount={followUps.length}
        onOpenFollowUps={() => setFollowUpsOpen(true)}
      />

      <div className={cn("h-full w-full lg:w-96 lg:shrink-0", selectedId && "hidden lg:block")}>
        <ConversationList
          conversations={conversations}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className={cn("h-full w-full flex-1", !selectedId && "hidden lg:flex")}>
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation.id}
            conversation={selectedConversation}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <EmptyChat />
        )}
      </div>

      <FollowUpCenter
        open={followUpsOpen}
        onOpenChange={setFollowUpsOpen}
        conversations={followUps}
        onSelect={setSelectedId}
      />
    </>
  );
}
