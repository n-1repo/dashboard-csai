"use client";

import { useRouter } from "next/navigation";

import { useRealtimeAuth } from "@/hooks/useRealtimeAuth";
import { Sidebar } from "@/components/whatsapp/Sidebar";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export default function SettingsPage() {
  const { operator } = useRealtimeAuth();
  const { logout, resetDemoData } = useStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <>
      <Sidebar operator={operator} />

      <div className="flex h-full w-full flex-col">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>

        <div className="max-w-md p-6">
          <div className="rounded-xl border border-border bg-panel-raised p-5">
            <div className="text-xs text-muted-foreground">Operator</div>
            <div className="mt-1 text-base font-medium text-foreground">{operator?.displayName ?? "-"}</div>
            <div className="text-sm text-muted-foreground">{operator?.email ?? "-"}</div>

            <Button variant="outline" className="mt-4" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-panel-raised p-5">
            <div className="text-sm font-medium text-foreground">Data prototype</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Semua percakapan dan kontak di prototype ini tersimpan di localStorage browser kamu. Reset untuk
              mengembalikan ke data contoh awal.
            </p>
            <Button variant="outline" className="mt-4" onClick={resetDemoData}>
              Reset data demo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
