"use client";

import { useStore } from "@/lib/store";

export function useContacts() {
  const { contacts } = useStore();
  return { contacts, loading: false, error: null, refresh: () => {} };
}
