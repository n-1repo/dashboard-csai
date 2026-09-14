"use client";

import { useStore } from "@/lib/store";

export type { OperatorSession } from "@/lib/store";

export function useRealtimeAuth() {
  const { operator, ready } = useStore();
  return { operator, ready };
}
