"use client";

import { useEffect, useState } from "react";

import { setRealtimeAuth } from "@/lib/supabase/browser";

export interface OperatorSession {
  id: string;
  email: string;
  displayName: string;
}

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export function useRealtimeAuth() {
  const [operator, setOperator] = useState<OperatorSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return;

      const data = await res.json();
      if (cancelled) return;

      await setRealtimeAuth(data.realtimeToken);
      setOperator({
        id: data.operator.id,
        email: data.operator.email,
        displayName: data.operator.displayName,
      });
      setReady(true);
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { operator, ready };
}
