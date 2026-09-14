"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useStore } from "@/lib/store";

export default function RootPage() {
  const router = useRouter();
  const { ready, operator } = useStore();

  useEffect(() => {
    if (!ready) return;
    router.replace(operator ? "/dashboard" : "/login");
  }, [ready, operator, router]);

  return null;
}
