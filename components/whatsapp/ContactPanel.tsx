"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ContactEditor } from "@/components/contacts/ContactEditor";
import { getInitials } from "@/lib/format";
import { useWindowStatus } from "@/hooks/useWindowStatus";
import type { Contact, Conversation } from "@/types/database";

const WINDOW_STATUS_LABEL: Record<"NONE" | "ACTIVE" | "EXPIRING" | "EXPIRED", string> = {
  NONE: "-",
  ACTIVE: "🟢 Active",
  EXPIRING: "🟡 Expiring",
  EXPIRED: "🔴 Expired",
};

const STATUS_OPTIONS: Conversation["status"][] = ["OPEN", "PENDING", "RESOLVED", "ARCHIVED"];

interface ContactPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  conversation: Conversation;
  onContactUpdated: (contact: Contact) => void;
}

export function ContactPanel({ open, onOpenChange, contact, conversation, onContactUpdated }: ContactPanelProps) {
  const [editing, setEditing] = useState(false);
  const name = contact.display_name || contact.profile_name || contact.phone_number;
  const { status: windowStatus, remainingLabel } = useWindowStatus(conversation.customer_window_expires_at);

  async function handleStatusChange(status: Conversation["status"]) {
    await fetch(`/api/conversations/${conversation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Contact info</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto p-4">
          <div className="flex flex-col items-center gap-2 py-4">
            <Avatar className="size-24">
              <AvatarFallback className="text-2xl">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="text-lg font-medium text-foreground">{name}</div>
            <div className="text-sm text-muted-foreground">{contact.phone_number}</div>
          </div>

          {editing ? (
            <ContactEditor
              contact={contact}
              onCancel={() => setEditing(false)}
              onSaved={(updated) => {
                onContactUpdated(updated);
                setEditing(false);
              }}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm text-foreground">{contact.email || "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Tags</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {contact.tags?.length ? (
                    contact.tags.map((tag) => (
                      <Badge key={tag} variant="muted">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-foreground">-</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Notes</div>
                <div className="text-sm whitespace-pre-wrap text-foreground">{contact.notes || "-"}</div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Dibuat</div>
                <div className="text-sm text-foreground">
                  {new Date(contact.created_at).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Customer window status</div>
                <div className="text-sm text-foreground">
                  {WINDOW_STATUS_LABEL[windowStatus]}
                  {windowStatus === "ACTIVE" || windowStatus === "EXPIRING" ? ` · ${remainingLabel} remaining` : ""}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Conversation status</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      className={
                        status === conversation.status
                          ? "rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                          : "rounded-full bg-panel-hover px-2 py-1 text-xs text-muted-foreground"
                      }
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground">Assigned operator</div>
                <div className="text-sm text-foreground">
                  {conversation.assigned_to ? "Assigned" : "Belum ditugaskan"}
                </div>
              </div>

              <Button variant="outline" type="button" onClick={() => setEditing(true)}>
                <Pencil className="size-4" />
                Edit Contact
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
