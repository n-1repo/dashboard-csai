"use client";

import { useEffect, useState } from "react";

import { formatWindowRemaining, getWindowStatus } from "@/lib/window-status";

export function useWindowStatus(expiresAt: string | null) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const status = getWindowStatus(expiresAt, now);
  const remainingLabel = expiresAt ? formatWindowRemaining(expiresAt, now) : "";

  return { status, remainingLabel };
}
