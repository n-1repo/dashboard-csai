import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { APP_SESSION_COOKIE, verifyAppSessionToken } from "@/lib/auth/session";
import {
  CONTACT_IMPORT_ROW_CAP,
  dedupeContactImportRows,
  isRowEmpty,
  validateContactImportRow,
  type ContactField,
  type ContactImportRowInput,
  type InvalidContactImportRow,
  type ValidatedContactImportRow,
} from "@/lib/contacts/import";
import type { Contact } from "@/types/database";

const CONTACT_FIELD_VALUES = ["phone_number", "display_name", "profile_name", "email", "notes", "tags"] as const;

const importSchema = z.object({
  filename: z.string().min(1).max(255),
  csvText: z.string().min(1).max(2_000_000),
  columnMapping: z.record(z.string(), z.enum(CONTACT_FIELD_VALUES)),
  mode: z.enum(["SKIP_EXISTING", "UPDATE_EXISTING"]),
});

export async function POST(req: NextRequest) {
  const token = req.cookies.get(APP_SESSION_COOKIE)?.value;
  const session = token ? await verifyAppSessionToken(token) : null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { filename, csvText, columnMapping, mode } = parsed.data;

  const parseResult = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
  });

  const rawRows = parseResult.data;

  if (rawRows.length > CONTACT_IMPORT_ROW_CAP) {
    return NextResponse.json(
      { error: `File melebihi batas maksimal ${CONTACT_IMPORT_ROW_CAP} baris` },
      { status: 400 },
    );
  }

  const mappedRows: ContactImportRowInput[] = rawRows.map((raw) => {
    const mapped: ContactImportRowInput = {};
    for (const [header, field] of Object.entries(columnMapping)) {
      (mapped as Record<ContactField, string | undefined>)[field] = raw[header];
    }
    return mapped;
  });

  const invalidRows: InvalidContactImportRow[] = [];
  const validRows: ValidatedContactImportRow[] = [];

  mappedRows.forEach((row, index) => {
    if (isRowEmpty(row)) return;

    const result = validateContactImportRow(row, index + 1);
    if (result.invalid) {
      invalidRows.push(result.invalid);
    } else {
      validRows.push(result.valid);
    }
  });

  const { rows: dedupedRows, duplicatesInFile } = dedupeContactImportRows(validRows);

  const supabase = getSupabaseServerClient();

  const phoneNumbers = dedupedRows.map((row) => row.phone_number);
  const { data: existingContacts, error: lookupError } = phoneNumbers.length
    ? await supabase.from("contacts").select("id, phone_number").in("phone_number", phoneNumbers)
    : { data: [] as Pick<Contact, "id" | "phone_number">[], error: null };

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  const existingByPhone = new Map((existingContacts ?? []).map((contact) => [contact.phone_number, contact]));

  const newRows = dedupedRows.filter((row) => !existingByPhone.has(row.phone_number));
  const existingRows = dedupedRows.filter((row) => existingByPhone.has(row.phone_number));

  let createdCount = 0;
  if (newRows.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("contacts")
      .insert(
        newRows.map((row) => ({
          phone_number: row.phone_number,
          display_name: row.display_name,
          profile_name: row.profile_name,
          email: row.email,
          notes: row.notes,
          tags: row.tags,
        })),
      )
      .select("id");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    createdCount = inserted?.length ?? 0;
  }

  let updatedCount = 0;
  let skippedCount = 0;

  if (mode === "UPDATE_EXISTING") {
    for (const row of existingRows) {
      const existing = existingByPhone.get(row.phone_number);
      if (!existing) continue;

      const update: Partial<Contact> = { display_name: row.display_name };
      if (row.profile_name) update.profile_name = row.profile_name;
      if (row.email) update.email = row.email;
      if (row.notes) update.notes = row.notes;
      if (row.tagsProvided) update.tags = row.tags;

      await supabase.from("contacts").update(update).eq("id", existing.id);
      updatedCount += 1;
    }
  } else {
    skippedCount = existingRows.length;
  }

  await supabase.from("contact_imports").insert({
    filename,
    total_rows: rawRows.length,
    created_count: createdCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    invalid_count: invalidRows.length,
    imported_by: session.operatorId,
  });

  return NextResponse.json({
    total: rawRows.length,
    created: createdCount,
    updated: updatedCount,
    skipped: skippedCount,
    invalid: invalidRows.length,
    duplicates_in_file: duplicatesInFile,
    invalid_rows: invalidRows,
  });
}
