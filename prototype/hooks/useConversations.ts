"use client";

import { useStore } from "@/lib/store";

export function useConversations() {
  const { conversations } = useStore();
  return { conversations, loading: false, error: null, refresh: () => {} };
}
