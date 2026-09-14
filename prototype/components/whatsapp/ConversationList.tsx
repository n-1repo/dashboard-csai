"use client";

import { useMemo, useState } from "react";
import { Search, SquarePen } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConversationItem } from "@/components/whatsapp/ConversationItem";
import type { ConversationWithContact } from "@/types/database";

type Filter = "all" | "unread" | "favourites" | "groups";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "favourites", label: "Favourites" },
  { key: "groups", label: "Groups" },
];

interface ConversationListProps {
  conversations: ConversationWithContact[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, loading, error, selectedId, onSelect }: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    let list = conversations;

    if (filter === "unread") {
      list = list.filter((c) => c.unread_count > 0);
    } else if (filter === "favourites") {
      list = list.filter((c) => c.contact.tags?.some((tag) => tag.toLowerCase() === "favourite"));
    } else if (filter === "groups") {
      list = [];
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((c) => {
        const name = (c.contact.display_name || c.contact.profile_name || "").toLowerCase();
        const phone = c.contact.phone_number.toLowerCase();
        const lastBody = c.last_message?.body?.toLowerCase() ?? "";
        return name.includes(query) || phone.includes(query) || lastBody.includes(query);
      });
    }

    return list;
  }, [conversations, filter, search]);

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-panel lg:w-96">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">Chats</h1>
        <SquarePen className="size-5 text-muted-foreground" />
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 px-3 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full bg-panel-hover px-3 py-1 text-xs font-medium text-muted-foreground transition-colors",
              filter === f.key && "bg-primary/10 text-primary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-4 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-destructive">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {filter === "groups" ? "Belum ada grup" : search ? "Tidak ada hasil pencarian" : "Belum ada percakapan"}
          </div>
        ) : (
          filtered.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === selectedId}
              onSelect={() => onSelect(conversation.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
