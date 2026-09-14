"use client";

import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CONTACT_IMPORT_FIELDS,
  CONTACT_IMPORT_ROW_CAP,
  dedupeContactImportRows,
  guessColumnMapping,
  isRowEmpty,
  validateContactImportRow,
  type ContactField,
  type ContactImportRowInput,
  type InvalidContactImportRow,
  type ValidatedContactImportRow,
} from "@/lib/contacts/import";
import type { Contact } from "@/types/database";

type Step = "upload" | "map" | "preview" | "result";

type ImportMode = "SKIP_EXISTING" | "UPDATE_EXISTING";

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
  duplicates_in_file: number;
  invalid_rows: InvalidContactImportRow[];
}

const TEMPLATE_CSV = "phone_number,display_name,profile_name,email,notes,tags\n";

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "contacts_template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

interface ImportContactsDialogProps {
  contacts: Contact[];
}

export function ImportContactsDialog({ contacts }: ImportContactsDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filename, setFilename] = useState("");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, ContactField | "IGNORE">>({});
  const [mode, setMode] = useState<ImportMode>("SKIP_EXISTING");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const existingPhones = useMemo(() => new Set(contacts.map((c) => c.phone_number)), [contacts]);

  const processed = useMemo(() => {
    const mappedRows: ContactImportRowInput[] = rawRows.map((raw) => {
      const row: ContactImportRowInput = {};
      for (const [header, field] of Object.entries(mapping)) {
        if (field === "IGNORE") continue;
        (row as Record<ContactField, string | undefined>)[field] = raw[header];
      }
      return row;
    });

    const invalidRows: InvalidContactImportRow[] = [];
    const validRows: ValidatedContactImportRow[] = [];

    mappedRows.forEach((row, index) => {
      if (isRowEmpty(row)) return;
      const rowResult = validateContactImportRow(row, index + 1);
      if (rowResult.invalid) {
        invalidRows.push(rowResult.invalid);
      } else {
        validRows.push(rowResult.valid);
      }
    });

    const { rows: dedupedRows, duplicatesInFile } = dedupeContactImportRows(validRows);
    const willCreate = dedupedRows.filter((row) => !existingPhones.has(row.phone_number)).length;
    const willMatchExisting = dedupedRows.length - willCreate;

    return { invalidRows, dedupedRows, duplicatesInFile, willCreate, willMatchExisting };
  }, [rawRows, mapping, existingPhones]);

  const canProceedFromMapping = Object.values(mapping).includes("phone_number") && Object.values(mapping).includes("display_name");

  function resetAll() {
    setStep("upload");
    setUploadError(null);
    setFilename("");
    setCsvText("");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setMode("SKIP_EXISTING");
    setSubmitting(false);
    setSubmitError(null);
    setResult(null);
  }

  async function handleFile(file: File) {
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("File harus berformat CSV");
      return;
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });

    if (!parsed.meta.fields || parsed.meta.fields.length === 0) {
      setUploadError("Header CSV tidak terbaca");
      return;
    }

    if (parsed.data.length > CONTACT_IMPORT_ROW_CAP) {
      setUploadError(`File berisi ${parsed.data.length} baris, melebihi batas maksimal ${CONTACT_IMPORT_ROW_CAP} baris`);
      return;
    }

    if (parsed.data.length === 0) {
      setUploadError("File CSV tidak berisi data");
      return;
    }

    setFilename(file.name);
    setCsvText(text);
    setHeaders(parsed.meta.fields);
    setRawRows(parsed.data);
    setMapping(guessColumnMapping(parsed.meta.fields));
    setStep("map");
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitError(null);

    const serverMapping: Record<string, ContactField> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (field !== "IGNORE") serverMapping[header] = field;
    }

    const res = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, csvText, columnMapping: serverMapping, mode }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setSubmitError(data?.error ?? "Gagal mengimpor kontak");
      return;
    }

    const data: ImportResult = await res.json();
    setResult(data);
    setStep("result");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetAll();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Import Contacts
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
        </DialogHeader>

        {step === "upload" ? (
          <div className="flex flex-col gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Upload className="size-8 text-muted-foreground" />
              <div className="text-sm text-foreground">Drag & drop file CSV di sini, atau klik untuk memilih</div>
              <div className="text-xs text-muted-foreground">Maksimal {CONTACT_IMPORT_ROW_CAP} baris per file</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}

            <Button variant="outline" type="button" onClick={downloadTemplate} className="self-start">
              <Download className="size-4" />
              Download CSV Template
            </Button>
          </div>
        ) : null}

        {step === "map" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Cocokkan kolom CSV Anda ({filename}) dengan field kontak. `phone_number` dan `display_name` wajib
              dipetakan.
            </p>

            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {headers.map((header) => (
                <div key={header} className="flex items-center justify-between gap-3 rounded-lg bg-panel-hover px-3 py-2">
                  <span className="truncate text-sm text-foreground">{header}</span>
                  <select
                    value={mapping[header] ?? "IGNORE"}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [header]: e.target.value as ContactField | "IGNORE" }))
                    }
                    className="rounded-md border border-border bg-panel px-2 py-1 text-sm text-foreground"
                  >
                    <option value="IGNORE">— Abaikan —</option>
                    {CONTACT_IMPORT_FIELDS.map((f) => (
                      <option key={f.field} value={f.field}>
                        {f.label}
                        {f.required ? " *" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setStep("upload")}>
                Kembali
              </Button>
              <Button type="button" disabled={!canProceedFromMapping} onClick={() => setStep("preview")}>
                Next: Preview
              </Button>
            </div>
          </div>
        ) : null}

        {step === "preview" ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Valid rows</div>
                <div className="text-lg font-semibold text-foreground">{processed.dedupedRows.length}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Invalid</div>
                <div className="text-lg font-semibold text-status-failed">{processed.invalidRows.length}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Duplicate in file</div>
                <div className="text-lg font-semibold text-status-expiring">{processed.duplicatesInFile}</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {processed.willCreate} kontak baru akan dibuat, {processed.willMatchExisting} nomor sudah ada di
              database.
            </p>

            {processed.willMatchExisting > 0 ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-foreground">Untuk nomor yang sudah ada:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("SKIP_EXISTING")}
                    className={`rounded-full px-3 py-1 text-xs ${
                      mode === "SKIP_EXISTING" ? "bg-primary/10 text-primary" : "bg-panel-hover text-muted-foreground"
                    }`}
                  >
                    Skip existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("UPDATE_EXISTING")}
                    className={`rounded-full px-3 py-1 text-xs ${
                      mode === "UPDATE_EXISTING" ? "bg-primary/10 text-primary" : "bg-panel-hover text-muted-foreground"
                    }`}
                  >
                    Update existing
                  </button>
                </div>
              </div>
            ) : null}

            {processed.invalidRows.length > 0 ? (
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg bg-panel-hover p-3">
                {processed.invalidRows.map((row) => (
                  <div key={row.rowNumber} className="text-xs text-destructive">
                    Row {row.rowNumber}: {row.reason}
                  </div>
                ))}
              </div>
            ) : null}

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setStep("map")} disabled={submitting}>
                Kembali
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={submitting || processed.dedupedRows.length === 0}>
                {submitting ? "Mengimpor..." : "Confirm Import"}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-lg font-semibold text-foreground">{result.total}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-lg font-semibold text-primary">{result.created}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Updated</div>
                <div className="text-lg font-semibold text-foreground">{result.updated}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Skipped</div>
                <div className="text-lg font-semibold text-foreground">{result.skipped}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Invalid</div>
                <div className="text-lg font-semibold text-status-failed">{result.invalid}</div>
              </div>
              <div className="rounded-lg bg-panel-hover p-3">
                <div className="text-xs text-muted-foreground">Duplicate in file</div>
                <div className="text-lg font-semibold text-status-expiring">{result.duplicates_in_file}</div>
              </div>
            </div>

            {result.invalid_rows.length > 0 ? (
              <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg bg-panel-hover p-3">
                {result.invalid_rows.map((row) => (
                  <div key={row.rowNumber} className="text-xs text-destructive">
                    Row {row.rowNumber}: {row.reason}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button type="button" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
