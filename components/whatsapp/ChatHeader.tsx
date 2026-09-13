"use client";

import { ArrowLeft, Info, MoreVertical, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/format";
import type { ConversationWithContact } from "@/types/database";

interface ChatHeaderProps {
  conversation: ConversationWithContact;
  onOpenContactPanel: () => void;
  onBack?: () => void;
}

export function ChatHeader({ conversation, onOpenContactPanel, onBack }: ChatHeaderProps) {
  const name = conversation.contact.display_name || conversation.contact.profile_name || conversation.contact.phone_number;

  return (
    <div className="flex items-center justify-between border-b border-border bg-panel-raised px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-1">
        {onBack ? (
          <Button variant="icon" size="icon" type="button" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="size-5" />
          </Button>
        ) : null}

        <button
          type="button"
          onClick={onOpenContactPanel}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <Avatar className="size-10 shrink-0">
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{name}</div>
            <div className="truncate text-xs text-muted-foreground">{conversation.contact.phone_number}</div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-1 text-muted-foreground">
        <Button variant="icon" size="icon" type="button" disabled>
          <Search className="size-5" />
        </Button>
        <Button variant="icon" size="icon" type="button" onClick={onOpenContactPanel}>
          <Info className="size-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="icon" size="icon" type="button">
              <MoreVertical className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpenContactPanel}>Contact info</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
