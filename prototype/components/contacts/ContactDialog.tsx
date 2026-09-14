"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContactEditor } from "@/components/contacts/ContactEditor";
import { getInitials } from "@/lib/format";
import type { Contact } from "@/types/database";

interface ContactDialogProps {
  contact: Contact | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (contact: Contact) => void;
}

export function ContactDialog({ contact, onOpenChange, onUpdated }: ContactDialogProps) {
  const [editing, setEditing] = useState(false);

  if (!contact) return null;

  const name = contact.display_name || contact.profile_name || contact.phone_number;

  return (
    <Dialog
      open={Boolean(contact)}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setEditing(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Contact" : "Contact detail"}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <ContactEditor
            contact={contact}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              onUpdated(updated);
              setEditing(false);
            }}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-14">
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-foreground">{name}</div>
                <div className="text-sm text-muted-foreground">{contact.phone_number}</div>
              </div>
            </div>

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
              <div className="text-sm text-foreground">{new Date(contact.created_at).toLocaleDateString()}</div>
            </div>

            <Button variant="outline" type="button" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit Contact
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
