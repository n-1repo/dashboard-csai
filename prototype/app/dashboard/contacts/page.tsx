"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useRealtimeAuth } from "@/hooks/useRealtimeAuth";
import { useContacts } from "@/hooks/useContacts";
import { Sidebar } from "@/components/whatsapp/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactDialog } from "@/components/contacts/ContactDialog";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import { getInitials } from "@/lib/format";

export default function ContactsPage() {
  const { operator } = useRealtimeAuth();
  const { contacts, loading, error, refresh } = useContacts();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter(
      (c) =>
        (c.display_name ?? "").toLowerCase().includes(query) ||
        c.phone_number.toLowerCase().includes(query),
    );
  }, [contacts, search]);

  const selectedContact = contacts.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      <Sidebar operator={operator} />

      <div className="flex h-full w-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
          <ImportContactsDialog contacts={contacts} />
        </div>

        <div className="p-4">
          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts"
              aria-label="Search contacts"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="flex flex-col gap-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {search ? "Tidak ada hasil pencarian" : "Belum ada kontak"}
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((contact) => {
                const name = contact.display_name || contact.profile_name || contact.phone_number;
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => setSelectedId(contact.id)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-panel-hover"
                  >
                    <Avatar className="size-10">
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{name}</div>
                      <div className="truncate text-xs text-muted-foreground">{contact.phone_number}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ContactDialog contact={selectedContact} onOpenChange={(open) => !open && setSelectedId(null)} onUpdated={() => refresh()} />
    </>
  );
}
