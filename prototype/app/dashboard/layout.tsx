"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useStore } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, operator } = useStore();

  useEffect(() => {
    if (ready && !operator) router.replace("/login");
  }, [ready, operator, router]);

  if (!ready || !operator) return null;

  return <div className="flex h-dvh w-full overflow-hidden bg-panel">{children}</div>;
}
