"use client";

import { useCallback, useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ConversationWithContact } from "@/types/database";

function sortConversations(list: ConversationWithContact[]) {
  return [...list].sort((a, b) => {
    const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    return bTime - aTime;
  });
}

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setConversations(sortConversations(data.conversations));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOne = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}`);
    if (!res.ok) return;
    const data = await res.json();
    const updated: ConversationWithContact = data.conversation;

    setConversations((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      const next = exists ? prev.map((c) => (c.id === updated.id ? updated : c)) : [...prev, updated];
      return sortConversations(next);
    });
  }, []);

  useEffect(() => {
    queueMicrotask(refresh);
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("conversations-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          const id = (payload.new as { id?: string })?.id ?? (payload.old as { id?: string })?.id;
          if (id) refreshOne(id);
        },
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contacts" }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshOne, refresh]);

  return { conversations, loading, error, refresh };
}
