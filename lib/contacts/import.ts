export const CONTACT_IMPORT_ROW_CAP = 1000;

export type ContactField = "phone_number" | "display_name" | "profile_name" | "email" | "notes" | "tags";

export const CONTACT_IMPORT_FIELDS: { field: ContactField; label: string; required: boolean }[] = [
  { field: "phone_number", label: "Phone number", required: true },
  { field: "display_name", label: "Display name", required: true },
  { field: "profile_name", label: "Profile name", required: false },
  { field: "email", label: "Email", required: false },
  { field: "notes", label: "Notes", required: false },
  { field: "tags", label: "Tags", required: false },
];

const FIELD_ALIASES: Record<ContactField, string[]> = {
  phone_number: ["phone_number", "phone", "phonenumber", "nohp", "nomor", "nomorhp", "whatsapp"],
  display_name: ["display_name", "displayname", "name", "nama"],
  profile_name: ["profile_name", "profilename"],
  email: ["email", "e-mail"],
  notes: ["notes", "note", "catatan"],
  tags: ["tags", "tag", "label"],
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[\s_-]/g, "");
}

export function guessColumnMapping(headers: string[]): Record<string, ContactField | "IGNORE"> {
  const mapping: Record<string, ContactField | "IGNORE"> = {};

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const match = (Object.entries(FIELD_ALIASES) as [ContactField, string[]][]).find(([, aliases]) =>
      aliases.includes(normalized),
    );
    mapping[header] = match ? match[0] : "IGNORE";
  }

  return mapping;
}

export function normalizePhoneNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let digits: string;
  if (trimmed.startsWith("+")) {
    digits = trimmed.slice(1);
  } else if (trimmed.startsWith("0")) {
    digits = `62${trimmed.slice(1)}`;
  } else {
    digits = trimmed;
  }

  if (!/^\d+$/.test(digits)) return null;
  if (!digits.startsWith("62")) return null;
  if (digits.length < 10 || digits.length > 15) return null;

  return digits;
}

export function parseTagsField(raw: string | undefined | null): string[] {
  if (!raw) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of raw.split(",")) {
    const tag = part.trim();
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  return tags;
}

export interface ContactImportRowInput {
  phone_number?: string;
  display_name?: string;
  profile_name?: string;
  email?: string;
  notes?: string;
  tags?: string;
}

export interface ValidatedContactImportRow {
  rowNumber: number;
  phone_number: string;
  display_name: string;
  profile_name: string | null;
  email: string | null;
  notes: string | null;
  tags: string[];
  tagsProvided: boolean;
}

export interface InvalidContactImportRow {
  rowNumber: number;
  reason: string;
}

export type ContactImportRowResult =
  | { valid: ValidatedContactImportRow; invalid?: undefined }
  | { valid?: undefined; invalid: InvalidContactImportRow };

export function validateContactImportRow(row: ContactImportRowInput, rowNumber: number): ContactImportRowResult {
  const rawPhone = row.phone_number?.trim();
  if (!rawPhone) {
    return { invalid: { rowNumber, reason: "Missing phone_number" } };
  }

  const displayName = row.display_name?.trim();
  if (!displayName) {
    return { invalid: { rowNumber, reason: "Missing display_name" } };
  }

  const phoneNumber = normalizePhoneNumber(rawPhone);
  if (!phoneNumber) {
    return { invalid: { rowNumber, reason: "Phone number invalid" } };
  }

  const tagsRaw = row.tags?.trim() ?? "";

  return {
    valid: {
      rowNumber,
      phone_number: phoneNumber,
      display_name: displayName,
      profile_name: row.profile_name?.trim() || null,
      email: row.email?.trim() || null,
      notes: row.notes?.trim() || null,
      tags: parseTagsField(tagsRaw),
      tagsProvided: tagsRaw.length > 0,
    },
  };
}

export function dedupeContactImportRows(rows: ValidatedContactImportRow[]) {
  const byPhone = new Map<string, ValidatedContactImportRow>();
  let duplicatesInFile = 0;

  for (const row of rows) {
    if (byPhone.has(row.phone_number)) duplicatesInFile += 1;
    byPhone.set(row.phone_number, row);
  }

  return { rows: Array.from(byPhone.values()), duplicatesInFile };
}

export function isRowEmpty(row: ContactImportRowInput) {
  return Object.values(row).every((value) => !value || !value.trim());
}
