"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatTimestamp, getInitials, messagePreview } from "@/lib/format";
import { useWindowStatus } from "@/hooks/useWindowStatus";
import { WindowStatusIcon } from "@/components/whatsapp/WindowStatusIcon";
import type { ConversationWithContact } from "@/types/database";

interface ConversationItemProps {
  conversation: ConversationWithContact;
  active: boolean;
  onSelect: () => void;
}

export function ConversationItem({ conversation, active, onSelect }: ConversationItemProps) {
  const name = conversation.contact.display_name || conversation.contact.profile_name || conversation.contact.phone_number;
  const { status: windowStatus, remainingLabel } = useWindowStatus(conversation.customer_window_expires_at);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border/60 px-3 py-3 text-left transition-colors hover:bg-panel-hover",
        active && "bg-panel-hover",
      )}
    >
      <Avatar className="size-12 shrink-0">
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-foreground">{name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatTimestamp(conversation.last_message_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-sm text-muted-foreground">
            {messagePreview(conversation.last_message)}
          </span>
          {conversation.unread_count > 0 ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
            </span>
          ) : null}
        </div>
        {windowStatus === "EXPIRING" || windowStatus === "EXPIRED" ? (
          <div
            className={cn(
              "mt-0.5 flex items-center gap-1 text-xs",
              windowStatus === "EXPIRING" ? "text-status-expiring" : "text-status-failed",
            )}
          >
            <WindowStatusIcon status={windowStatus} />
            {windowStatus === "EXPIRING" ? remainingLabel : "Expired"}
          </div>
        ) : null}
      </div>
    </button>
  );
}
