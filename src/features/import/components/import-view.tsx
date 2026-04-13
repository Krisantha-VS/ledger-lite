"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, ChevronRight, Check, AlertCircle, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { accountTypeLabel } from "@/lib/account-types";

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let i = 0;

  while (i < text.length) {
    const row: string[] = [];
    let inRow = true;

    while (inRow) {
      if (text[i] === '"') {
        let field = "";
        i++;
        while (i < text.length) {
          if (text[i] === '"' && text[i + 1] === '"') { field += '"'; i += 2; }
          else if (text[i] === '"') { i++; break; }
          else { field += text[i++]; }
        }
        row.push(field);
      } else {
        let field = "";
        while (i < text.length && text[i] !== "," && text[i] !== "\n") field += text[i++];
        row.push(field.trim());
      }

      if (i >= text.length || text[i] === "\n") { i++; inRow = false; }
      else if (text[i] === ",") { i++; }
    }

    if (row.length > 0 && !(row.length === 1 && row[0] === "")) rows.push(row);
  }

  return rows;
}

// ─── Column auto-detection ───────────────────────────────────────────────────

interface ColMap {
  date: number; description: number; amount: number;
  type: number; credit: number; debit: number;
  mintCategory: number; mintDates: boolean;
}

function detectMint(headers: string[]): boolean {
  const h = headers.map(s => s.toLowerCase().trim());
  return h.includes("original description") && h.includes("transaction type");
}

function autoDetectColumns(headers: string[]): ColMap | null {
  const h = headers.map(s => s.toLowerCase().trim());
  const find = (...terms: string[]) => h.findIndex(col => terms.some(t => col.includes(t)));

  const dateIdx     = find("date");
  const amountIdx   = find("amount");
  const descIdx     = find("description", "memo", "payee", "narrative", "details");
  const typeIdx     = find("type");
  const creditIdx   = find("credit");
  const debitIdx    = find("debit");
  const categoryIdx = find("category");

  if (dateIdx === -1 || descIdx === -1) return null;
  if (amountIdx === -1 && creditIdx === -1 && debitIdx === -1) return null;

  const isMint = detectMint(headers);
  return { date: dateIdx, description: descIdx, amount: amountIdx, type: typeIdx,
           credit: creditIdx, debit: debitIdx, mintCategory: isMint ? categoryIdx : -1, mintDates: isMint };
}

// ─── Row parsing ─────────────────────────────────────────────────────────────

interface ParsedRow {
  date: string; description: string; amount: number;
  type: "income" | "expense"; categoryName?: string; confidence?: number;
}

function toISODate(raw: string, mdy = false): string | null {
  raw = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parts = raw.split(/[\/\-\.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2,"0")}-${parts[2].padStart(2,"0")}`;
    if (mdy) return `${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`;
    return `${parts[2]}-${parts[1].padStart(2,"0")}-${parts[0].padStart(2,"0")}`;
  }
  return null;
}

function buildRows(rows: string[][], colMap: ColMap): { valid: ParsedRow[]; invalid: number } {
  let invalid = 0;
  const valid: ParsedRow[] = [];

  for (const row of rows) {
    try {
      const dateStr = toISODate(row[colMap.date] ?? "", colMap.mintDates);
      if (!dateStr) { invalid++; continue; }

      const desc = (row[colMap.description] ?? "").trim();
      let amount = 0;
      let type: "income" | "expense" = "expense";

      if (colMap.credit !== -1 && colMap.debit !== -1) {
        const creditVal = parseFloat((row[colMap.credit] ?? "0").replace(/[^0-9.\-]/g, ""));
        const debitVal  = parseFloat((row[colMap.debit]  ?? "0").replace(/[^0-9.\-]/g, ""));
        if (!isNaN(creditVal) && creditVal > 0) { amount = creditVal; type = "income"; }
        else if (!isNaN(debitVal) && debitVal > 0) { amount = debitVal; type = "expense"; }
        else { invalid++; continue; }
      } else if (colMap.amount !== -1) {
        const raw = parseFloat((row[colMap.amount] ?? "").replace(/[^0-9.\-]/g, ""));
        if (isNaN(raw) || raw === 0) { invalid++; continue; }
        amount = Math.abs(raw);
        if (colMap.type !== -1) {
          const t = (row[colMap.type] ?? "").toLowerCase().trim();
          type = t.includes("income") || t.includes("credit") ? "income" : "expense";
        } else {
          type = raw >= 0 ? "income" : "expense";
        }
      } else { invalid++; continue; }

      const categoryName = colMap.mintCategory !== -1
        ? (row[colMap.mintCategory] ?? "").trim() || undefined : undefined;

      valid.push({ date: dateStr, description: desc, amount, type, categoryName });
    } catch { invalid++; }
  }

  return { valid, invalid };
}

// ─── Component ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type Mode = "csv" | "ai";

export function ImportView() {
  const { accounts, loading: accountsLoading } = useAccounts();
  const { categories, loading: categoriesLoading } = useCategories();

  const [step, setStep]       = useState<Step>(1);
  const [mode, setMode]       = useState<Mode>("csv");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileObj, setFileObj]   = useState<File | null>(null);

  // CSV state
  const [headers, setHeaders]           = useState<string[]>([]);
  const [allRows, setAllRows]           = useState<string[][]>([]);
  const [colMap, setColMap]             = useState<ColMap | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);
  const [isMint, setIsMint]             = useState(false);
  const [manualDate,   setManualDate]   = useState("0");
  const [manualDesc,   setManualDesc]   = useState("1");
  const [manualAmount, setManualAmount] = useState("2");
  const [manualType,   setManualType]   = useState("-1");

  // AI state
  const [aiRows, setAiRows]       = useState<ParsedRow[]>([]);
  const [aiParsing, setAiParsing] = useState(false);
  const [aiModel, setAiModel]     = useState("");

  // Duplicate detection
  type RowWithDup = ParsedRow & { isDuplicate?: boolean };
  const [rowsWithDups, setRowsWithDups] = useState<RowWithDup[]>([]);
  const [checkedRows, setCheckedRows]   = useState<Set<number>>(new Set());

  // Shared
  const [accountId,  setAccountId]  = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── File handling ──────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    const isPDF = file.name.toLowerCase().endsWith(".pdf");
    const isCSV = file.name.toLowerCase().endsWith(".csv");

    if (!isPDF && !isCSV) {
      toast.error("Please upload a CSV or PDF file");
      return;
    }

    setFileName(file.name);
    setFileObj(file);

    if (isPDF) {
      setMode("ai");
      setStep(2);
      runAIParse(file); // auto-trigger immediately, don't wait for state update
      return;
    }

    // CSV — try auto-detect first
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error("CSV appears empty or has no data rows"); return; }

      const hdrs = rows[0];
      const data = rows.slice(1);
      setHeaders(hdrs);
      setAllRows(data);

      const detected = autoDetectColumns(hdrs);
      if (detected) {
        setColMap(detected);
        setAutoDetected(true);
        setIsMint(detected.mintCategory !== -1);
        setMode("csv");
      } else {
        setColMap(null);
        setAutoDetected(false);
        setIsMint(false);
        setManualDate("0");
        setManualDesc(hdrs.length > 1 ? "1" : "0");
        setManualAmount(hdrs.length > 2 ? "2" : "0");
        setManualType("-1");
        setMode("csv"); // will offer AI fallback below
      }
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  // ── AI parse trigger ───────────────────────────────────────────────────────

  const runAIParse = async (overrideFile?: File) => {
    const f = overrideFile ?? fileObj;
    if (!f) return;
    setAiParsing(true);
    setMode("ai");
    try {
      const form = new FormData();
      form.append("file", f);

      const res  = await authFetch("/api/v1/import/ai", { method: "POST", body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "AI parsing failed");

      const rows: ParsedRow[] = json.data.transactions;
      setAiRows(rows);
      setAiModel(json.data.model ?? "");
      toast.success(`AI extracted ${rows.length} transactions`);
      await checkDuplicates(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI parsing failed");
      setMode("csv"); // fall back to manual
    } finally {
      setAiParsing(false);
    }
  };

  // ── Duplicate detection ────────────────────────────────────────────────────

  const checkDuplicates = async (rows: ParsedRow[]) => {
    try {
      const res  = await authFetch("/api/v1/transactions?perPage=200");
      const json = await res.json();
      const existing: { amount: number; date: string }[] = json.success ? (json.data?.rows ?? []) : [];

      const marked: RowWithDup[] = rows.map(row => {
        const isDuplicate = existing.some(ex =>
          Math.abs(ex.amount - row.amount) < 0.01 &&
          ex.date.slice(0, 10) === row.date
        );
        return { ...row, isDuplicate };
      });

      setRowsWithDups(marked);
      // Start with all non-duplicates checked; duplicates unchecked
      const checked = new Set<number>();
      marked.forEach((r, i) => { if (!r.isDuplicate) checked.add(i); });
      setCheckedRows(checked);
    } catch {
      // If duplicate check fails, mark all as checked with no duplicates
      const marked: RowWithDup[] = rows.map(r => ({ ...r, isDuplicate: false }));
      setRowsWithDups(marked);
      setCheckedRows(new Set(rows.map((_, i) => i)));
    }
  };

  // ── Active rows for preview / import ──────────────────────────────────────

  const effectiveColMap: ColMap = colMap ?? {
    date: parseInt(manualDate), description: parseInt(manualDesc),
    amount: parseInt(manualAmount), type: parseInt(manualType),
    credit: -1, debit: -1, mintCategory: -1, mintDates: false,
  };

  const csvPreviewRows = mode === "csv" ? buildRows(allRows.slice(0, 10), effectiveColMap).valid : [];
  const aiPreviewRows  = mode === "ai"  ? (rowsWithDups.length > 0 ? rowsWithDups : aiRows) : [];
  const previewRows    = mode === "ai"  ? aiPreviewRows.slice(0, 10) : csvPreviewRows;

  // Summary counts for AI mode
  const dupCount      = rowsWithDups.filter(r => r.isDuplicate).length;
  const newCount      = rowsWithDups.filter(r => !r.isDuplicate).length;
  const checkedCount  = checkedRows.size;

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!accountId) { toast.error("Please select an account"); return; }

    let validRows: ParsedRow[];
    let invalidCount = 0;

    if (mode === "ai") {
      // Only submit checked rows
      validRows = rowsWithDups.length > 0
        ? rowsWithDups.filter((_, i) => checkedRows.has(i))
        : aiRows;
    } else {
      const { valid, invalid } = buildRows(allRows, effectiveColMap);
      validRows    = valid;
      invalidCount = invalid;
    }

    if (validRows.length === 0) { toast.error("No valid rows to import"); return; }

    setImporting(true);
    try {
      const body: Record<string, unknown> = {
        transactions: validRows,
        accountId:    parseInt(accountId),
      };
      if (categoryId) body.categoryId = parseInt(categoryId);

      const res  = await authFetch("/api/v1/transactions/import", {
        method: "POST", body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Import failed");

      setImportResult({ imported: json.data.imported, skipped: (json.data.skipped ?? 0) + invalidCount });
      setStep(3);
      toast.success(`Imported ${json.data.imported} transactions`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────

  const reset = () => {
    setStep(1); setMode("csv"); setFileName(""); setFileObj(null);
    setHeaders([]); setAllRows([]); setColMap(null);
    setAutoDetected(false); setIsMint(false);
    setAiRows([]); setAiModel("");
    setRowsWithDups([]); setCheckedRows(new Set());
    setAccountId(""); setCategoryId(""); setImportResult(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const lowConfidenceCount = aiRows.filter(r => (r.confidence ?? 1) < 0.7).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5" style={{ color: "hsl(var(--ll-accent))" }} />
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Import Transactions</h1>
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Upload a CSV or PDF bank statement</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                background: step >= s ? "hsl(var(--ll-accent))" : "hsl(var(--ll-bg-elevated))",
                color: step >= s ? "#fff" : "hsl(var(--ll-text-muted))",
              }}
            >
              {step > s ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            <span className="text-xs font-medium" style={{ color: step === s ? "hsl(var(--ll-text-primary))" : "hsl(var(--ll-text-muted))" }}>
              {s === 1 ? "Upload" : s === 2 ? "Review" : "Done"}
            </span>
            {idx < 2 && <ChevronRight className="h-3.5 w-3.5 mx-1" style={{ color: "hsl(var(--ll-text-muted))" }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div className="ll-card p-6">
          <div
            className="relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed py-12 transition-colors cursor-pointer"
            style={{
              borderColor: dragging ? "hsl(var(--ll-accent))" : "hsl(var(--ll-border))",
              background:  dragging ? "hsl(var(--ll-accent) / 0.05)" : "hsl(var(--ll-bg-elevated) / 0.5)",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "hsl(var(--ll-accent) / 0.12)" }}>
              <Upload className="h-6 w-6" style={{ color: "hsl(var(--ll-accent))" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                Drop your bank file here, or click to browse
              </p>
              <p className="mt-1 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                CSV or PDF · Any bank · AI-powered extraction
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.pdf" className="hidden" onChange={onFileChange} />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "hsl(var(--ll-accent) / 0.06)" }}>
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "hsl(var(--ll-accent))" }} />
            <p className="text-xs" style={{ color: "hsl(var(--ll-text-secondary))" }}>
              PDF statements are parsed automatically using AI — no column mapping needed.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div className="space-y-4">

          {/* Status bar */}
          <div className="ll-card p-5">
            <div className="flex items-start gap-3">
              {mode === "ai" && aiParsing ? (
                <div className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "hsl(var(--ll-accent))" }} />
              ) : mode === "ai" && aiRows.length > 0 ? (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-accent))" }} />
              ) : autoDetected ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                    {mode === "ai" && aiParsing
                      ? "AI is reading your statement…"
                      : mode === "ai" && aiRows.length > 0
                        ? `AI extracted ${aiRows.length} transactions`
                        : autoDetected
                          ? "Columns auto-detected"
                          : "Map columns manually"}
                  </p>
                  {isMint && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "hsl(var(--ll-accent) / 0.15)", color: "hsl(var(--ll-accent))" }}>
                      Mint CSV
                    </span>
                  )}
                  {mode === "ai" && aiModel && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "hsl(var(--ll-accent) / 0.15)", color: "hsl(var(--ll-accent))" }}>
                      {aiModel}
                    </span>
                  )}
                </div>
                <p className="text-xs truncate" style={{ color: "hsl(var(--ll-text-muted))", maxWidth: "260px" }}>
                  {fileName.length > 40 ? fileName.slice(0, 37) + "…" : fileName}
                  {mode === "csv" && allRows.length > 0 && ` · ${allRows.length} rows`}
                  {mode === "ai" && aiRows.length > 0 && lowConfidenceCount > 0
                    && ` · ${lowConfidenceCount} low-confidence row${lowConfidenceCount !== 1 ? "s" : ""}`}
                  {isMint && " · categories will be preserved"}
                </p>
              </div>

              {/* Offer AI parse for CSVs that failed auto-detect or as upgrade */}
              {mode === "csv" && !aiParsing && aiRows.length === 0 && (
                <button
                  onClick={() => runAIParse()}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ background: "hsl(var(--ll-accent))" }}
                >
                  <Sparkles className="h-3 w-3" />
                  Try AI
                </button>
              )}

              {aiParsing && (
                <div className="flex-shrink-0 flex items-center gap-1.5 text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                  Parsing…
                </div>
              )}
            </div>
          </div>

          {/* Low-confidence warning */}
          {mode === "ai" && lowConfidenceCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.2)" }}>
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                {lowConfidenceCount} row{lowConfidenceCount !== 1 ? "s are" : " is"} flagged low-confidence. Review them before importing.
              </p>
            </div>
          )}

          {/* Manual column mapping (CSV only, when auto-detect failed) */}
          {mode === "csv" && !autoDetected && aiRows.length === 0 && (
            <div className="ll-card p-5">
              <h2 className="mb-4 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Column mapping</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Date column",        value: manualDate,   setter: setManualDate },
                  { label: "Description column", value: manualDesc,   setter: setManualDesc },
                  { label: "Amount column",      value: manualAmount, setter: setManualAmount },
                  { label: "Type column (opt.)", value: manualType,   setter: setManualType },
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>{label}</label>
                    <select className="ll-input" value={value} onChange={e => setter(e.target.value)}>
                      {label.includes("opt") && <option value="-1">— not present —</option>}
                      {headers.map((h, idx) => (
                        <option key={idx} value={String(idx)}>{h || `Column ${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account + Category */}
          <div className="ll-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Import settings</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                  Account <span className="text-rose-400">*</span>
                </label>
                {accountsLoading ? (
                  <div className="ll-input text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Loading…</div>
                ) : (
                  <select className="ll-input" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="">Select account…</option>
                    {accounts.map(a => (
                      <option key={a.id} value={String(a.id)}>
                        {a.name} — {accountTypeLabel(a.type)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                  Default category <span style={{ color: "hsl(var(--ll-text-muted))" }}>(optional{mode === "ai" ? " — AI suggests categories per row" : ""})</span>
                </label>
                {categoriesLoading ? (
                  <div className="ll-input text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Loading…</div>
                ) : (
                  <select className="ll-input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    <option value="">Auto-select first category</option>
                    {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div className="ll-card overflow-hidden p-0">
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid hsl(var(--ll-border))" }}>
                <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  Preview (first {Math.min(10, previewRows.length)} rows)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(var(--ll-border))" }}>
                      {[
                        ...(mode === "ai" && rowsWithDups.length > 0 ? [""] : []),
                        "Date", "Description", "Amount", "Type",
                        ...(isMint || mode === "ai" ? ["Category"] : []),
                        ...(mode === "ai" ? ["Confidence"] : []),
                      ].map((h, idx) => (
                        <th key={idx} className="px-4 py-2 text-left font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => {
                      const rowWithDup = row as RowWithDup;
                      const lowConf    = (row.confidence ?? 1) < 0.7;
                      const isDup      = rowWithDup.isDuplicate === true;
                      const isChecked  = checkedRows.has(i);
                      return (
                        <tr key={i} style={{
                          borderBottom: i < previewRows.length - 1 ? "1px solid hsl(var(--ll-border) / 0.5)" : undefined,
                          background: isDup
                            ? "hsl(48 96% 50% / 0.05)"
                            : lowConf ? "hsl(38 92% 50% / 0.04)" : undefined,
                          opacity: mode === "ai" && rowsWithDups.length > 0 && !isChecked ? 0.45 : 1,
                        }}>
                          {mode === "ai" && rowsWithDups.length > 0 && (
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const next = new Set(checkedRows);
                                  if (isChecked) next.delete(i); else next.add(i);
                                  setCheckedRows(next);
                                }}
                                className="h-3.5 w-3.5 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-4 py-2" style={{ color: "hsl(var(--ll-text-secondary))" }}>{row.date}</td>
                          <td className="px-4 py-2 max-w-[160px] truncate" style={{ color: "hsl(var(--ll-text-primary))" }}>
                            {row.description}
                            {isDup && (
                              <span className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-yellow-500/15 text-yellow-500">
                                Duplicate?
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono" style={{ color: row.type === "income" ? "hsl(var(--ll-income))" : "hsl(var(--ll-expense))" }}>
                            {row.type === "expense" ? "-" : "+"}{row.amount.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 capitalize" style={{ color: row.type === "income" ? "hsl(var(--ll-income))" : "hsl(var(--ll-expense))" }}>{row.type}</td>
                          {(isMint || mode === "ai") && (
                            <td className="px-4 py-2 max-w-[110px] truncate" style={{ color: "hsl(var(--ll-text-muted))" }}>{row.categoryName ?? "—"}</td>
                          )}
                          {mode === "ai" && (
                            <td className="px-4 py-2">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${lowConf ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
                                {Math.round((row.confidence ?? 1) * 100)}%
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {previewRows.length === 0 && !aiParsing && mode !== "ai" && (
            <div className="ll-card p-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <p className="text-sm" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  No rows could be parsed. Try AI parsing instead.
                </p>
              </div>
            </div>
          )}

          {/* Duplicate summary */}
          {mode === "ai" && rowsWithDups.length > 0 && (
            <p className="text-xs px-1" style={{ color: "hsl(var(--ll-text-muted))" }}>
              <span style={{ color: "hsl(var(--ll-income))" }}>{newCount} new</span>
              {dupCount > 0 && (
                <>, <span className="text-yellow-500">{dupCount} possible duplicate{dupCount !== 1 ? "s" : ""} (unchecked)</span></>
              )}
              {" · "}{checkedCount} selected for import
            </p>
          )}

          <div className="flex gap-3">
            <button onClick={reset} className="flex-none rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ background: "hsl(var(--ll-bg-elevated))", color: "hsl(var(--ll-text-secondary))", border: "1px solid hsl(var(--ll-border))" }}>
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || aiParsing || previewRows.length === 0 || !accountId || (mode === "ai" && rowsWithDups.length > 0 && checkedCount === 0)}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
              style={{ background: "hsl(var(--ll-accent))" }}
            >
              {importing
                ? "Importing…"
                : mode === "ai" && rowsWithDups.length > 0
                  ? `Import ${checkedCount} transaction${checkedCount !== 1 ? "s" : ""}`
                  : mode === "ai"
                    ? `Import ${aiRows.length} transaction${aiRows.length !== 1 ? "s" : ""}`
                    : `Import ${allRows.length} transaction${allRows.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === 3 && importResult && (
        <div className="ll-card p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "hsl(var(--ll-income) / 0.12)" }}>
              <Check className="h-7 w-7" style={{ color: "hsl(var(--ll-income))" }} />
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Import complete</p>
              <p className="mt-1 text-sm" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                Successfully imported <span className="font-semibold" style={{ color: "hsl(var(--ll-income))" }}>{importResult.imported}</span> transaction{importResult.imported !== 1 ? "s" : ""}
                {importResult.skipped > 0 && <> &middot; <span className="font-semibold" style={{ color: "hsl(var(--ll-text-muted))" }}>{importResult.skipped}</span> skipped</>}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={reset} className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition-colors" style={{ background: "hsl(var(--ll-accent))" }}>
                Import another file
              </button>
              <a href="/transactions" className="flex-1 rounded-lg py-2 text-sm font-medium text-center transition-colors"
                style={{ background: "hsl(var(--ll-bg-elevated))", color: "hsl(var(--ll-text-secondary))", border: "1px solid hsl(var(--ll-border))" }}>
                View transactions
              </a>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex items-center gap-2 px-1">
          <FileText className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-text-muted))" }} />
          <span className="text-xs truncate max-w-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>
            {fileName.length > 50 ? fileName.slice(0, 47) + "…" : fileName}
          </span>
        </div>
      )}
    </div>
  );
}
