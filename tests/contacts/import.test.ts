import { describe, expect, it } from "vitest";

import {
  dedupeContactImportRows,
  guessColumnMapping,
  normalizePhoneNumber,
  parseTagsField,
  validateContactImportRow,
  type ValidatedContactImportRow,
} from "@/lib/contacts/import";

describe("normalizePhoneNumber", () => {
  it("converts a leading 0 to the 62 country code", () => {
    expect(normalizePhoneNumber("08123456789")).toBe("628123456789");
  });

  it("strips a leading +", () => {
    expect(normalizePhoneNumber("+628123456789")).toBe("628123456789");
  });

  it("leaves an already-normalized number unchanged", () => {
    expect(normalizePhoneNumber("628123456789")).toBe("628123456789");
  });

  it("rejects a number that is too short", () => {
    expect(normalizePhoneNumber("12345")).toBeNull();
  });

  it("rejects non-digit input", () => {
    expect(normalizePhoneNumber("abc123")).toBeNull();
  });

  it("rejects a number without the 62 country code", () => {
    expect(normalizePhoneNumber("15551234567")).toBeNull();
  });

  it("rejects a number that is too long", () => {
    expect(normalizePhoneNumber("6281234567890123")).toBeNull();
  });
});

describe("parseTagsField", () => {
  it("splits, trims, and dedupes tags", () => {
    expect(parseTagsField("customer, prioritas, customer")).toEqual(["customer", "prioritas"]);
  });

  it("ignores empty tags", () => {
    expect(parseTagsField("customer,, ,prioritas")).toEqual(["customer", "prioritas"]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseTagsField("")).toEqual([]);
    expect(parseTagsField(undefined)).toEqual([]);
  });
});

describe("validateContactImportRow", () => {
  it("flags a missing phone_number", () => {
    const result = validateContactImportRow({ display_name: "Rina" }, 1);
    expect(result.invalid).toEqual({ rowNumber: 1, reason: "Missing phone_number" });
  });

  it("flags a missing display_name", () => {
    const result = validateContactImportRow({ phone_number: "08123456789" }, 1);
    expect(result.invalid).toEqual({ rowNumber: 1, reason: "Missing display_name" });
  });

  it("flags an invalid phone number", () => {
    const result = validateContactImportRow({ phone_number: "abc", display_name: "Rina" }, 1);
    expect(result.invalid).toEqual({ rowNumber: 1, reason: "Phone number invalid" });
  });

  it("accepts a valid row and normalizes the phone number to the webhook format", () => {
    const result = validateContactImportRow(
      { phone_number: "08123456789", display_name: "Rina", tags: "customer,prioritas" },
      1,
    );
    expect(result.valid).toEqual({
      rowNumber: 1,
      phone_number: "628123456789",
      display_name: "Rina",
      profile_name: null,
      email: null,
      notes: null,
      tags: ["customer", "prioritas"],
      tagsProvided: true,
    });
  });

  it("marks tags as not provided when the CSV cell is empty", () => {
    const result = validateContactImportRow({ phone_number: "08123456789", display_name: "Rina" }, 1);
    expect(result.valid?.tagsProvided).toBe(false);
  });
});

describe("dedupeContactImportRows", () => {
  function row(phone: string, displayName: string): ValidatedContactImportRow {
    return {
      rowNumber: 0,
      phone_number: phone,
      display_name: displayName,
      profile_name: null,
      email: null,
      notes: null,
      tags: [],
      tagsProvided: false,
    };
  }

  it("keeps the last occurrence when the same number appears more than once", () => {
    const { rows, duplicatesInFile } = dedupeContactImportRows([
      row("628123456789", "Rina (old)"),
      row("628111111111", "Budi"),
      row("628123456789", "Rina (new)"),
    ]);

    expect(duplicatesInFile).toBe(1);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.phone_number === "628123456789")?.display_name).toBe("Rina (new)");
  });

  it("reports zero duplicates when every number is unique", () => {
    const { rows, duplicatesInFile } = dedupeContactImportRows([row("628123456789", "Rina"), row("628111111111", "Budi")]);
    expect(duplicatesInFile).toBe(0);
    expect(rows).toHaveLength(2);
  });
});

describe("guessColumnMapping", () => {
  it("preselects mappings for recognized header aliases", () => {
    const mapping = guessColumnMapping(["Phone", "Name", "Email", "Note", "Tags", "Unknown Column"]);
    expect(mapping).toEqual({
      Phone: "phone_number",
      Name: "display_name",
      Email: "email",
      Note: "notes",
      Tags: "tags",
      "Unknown Column": "IGNORE",
    });
  });

  it("recognizes the exact contacts schema column names", () => {
    const mapping = guessColumnMapping(["phone_number", "display_name", "profile_name", "notes"]);
    expect(mapping.phone_number).toBe("phone_number");
    expect(mapping.display_name).toBe("display_name");
    expect(mapping.profile_name).toBe("profile_name");
    expect(mapping.notes).toBe("notes");
  });
});
