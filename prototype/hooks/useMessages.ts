"use client";

import { useStore } from "@/lib/store";

export function useMessages(conversationId: string | null) {
  const { getMessages } = useStore();
  return { messages: getMessages(conversationId), loading: false, error: null };
}
