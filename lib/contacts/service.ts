import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Contact } from "@/types/database";

export interface FindOrCreateContactResult {
  contact: Contact;
  created: boolean;
}

export async function findOrCreateContact(
  supabase: SupabaseClient,
  phoneNumber: string,
  profileName: string | null,
): Promise<FindOrCreateContactResult> {
  const { data: existing } = await supabase
    .from("contacts")
    .select("*")
    .eq("phone_number", phoneNumber)
    .maybeSingle<Contact>();

  if (existing) {
    if (profileName && profileName !== existing.profile_name) {
      const { data: updated } = await supabase
        .from("contacts")
        .update({ profile_name: profileName })
        .eq("id", existing.id)
        .select("*")
        .single<Contact>();
      return { contact: updated ?? existing, created: false };
    }
    return { contact: existing, created: false };
  }

  const { data: created, error } = await supabase
    .from("contacts")
    .insert({
      phone_number: phoneNumber,
      display_name: profileName,
      profile_name: profileName,
    })
    .select("*")
    .single<Contact>();

  if (error || !created) {
    throw new Error(`Failed to create contact: ${error?.message}`);
  }

  return { contact: created, created: true };
}
