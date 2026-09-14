"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/format";
import { useWindowStatus } from "@/hooks/useWindowStatus";
import { WindowStatusIcon } from "@/components/whatsapp/WindowStatusIcon";
import type { ConversationWithContact } from "@/types/database";

interface FollowUpCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: ConversationWithContact[];
  onSelect: (conversationId: string) => void;
}

function FollowUpItem({
  conversation,
  onSelect,
}: {
  conversation: ConversationWithContact;
  onSelect: (id: string) => void;
}) {
  const name = conversation.contact.display_name || conversation.contact.profile_name || conversation.contact.phone_number;
  const { status, remainingLabel } = useWindowStatus(conversation.customer_window_expires_at);

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-panel-hover"
    >
      <Avatar className="size-9">
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{name}</span>
      <span
        className={cn(
          "flex shrink-0 items-center gap-1 text-sm",
          status === "EXPIRED" ? "text-status-failed" : "text-status-expiring",
        )}
      >
        <WindowStatusIcon status={status === "EXPIRED" ? "EXPIRED" : "EXPIRING"} />
        {status === "EXPIRED" ? "Expired" : remainingLabel}
      </span>
    </button>
  );
}

export function FollowUpCenter({ open, onOpenChange, conversations, onSelect }: FollowUpCenterProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Follow-ups</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Tidak ada percakapan yang mendekati batas waktu 24 jam
            </div>
          ) : (
            conversations.map((conversation) => (
              <FollowUpItem
                key={conversation.id}
                conversation={conversation}
                onSelect={(id) => {
                  onSelect(id);
                  onOpenChange(false);
                }}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
