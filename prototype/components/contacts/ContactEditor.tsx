"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import type { Contact } from "@/types/database";

interface ContactEditorProps {
  contact: Contact;
  onSaved: (contact: Contact) => void;
  onCancel: () => void;
}

export function ContactEditor({ contact, onSaved, onCancel }: ContactEditorProps) {
  const { updateContact } = useStore();
  const [displayName, setDisplayName] = useState(contact.display_name ?? "");
  const [email, setEmail] = useState(contact.email ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [tags, setTags] = useState(contact.tags?.join(", ") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const updated = updateContact(contact.id, {
      display_name: displayName || null,
      email: email || null,
      notes: notes || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });

    if (updated) onSaved(updated);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display_name">Nama</Label>
        <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, reseller" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan</Button>
      </div>
    </form>
  );
}
