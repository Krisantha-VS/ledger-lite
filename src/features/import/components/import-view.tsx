"use client";

import { useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, ChevronLeft, ChevronRight, Check, AlertCircle, Sparkles, AlertTriangle, Building2, Calendar, ArrowLeftRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/shared/lib/auth-client";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { accountTypeLabel } from "@/lib/account-types";
import type { Transaction } from "@/shared/types";
import type { StatementMeta } from "@/lib/ai/parse-document";

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
  isTransfer?: boolean;
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

// ─── Recurring detection ─────────────────────────────────────────────────────

function detectRecurring(
  rows: ParsedRow[],
  existing: Transaction[]
): Map<number, { recurrence: "weekly" | "monthly"; confidence: number }> {
  const suggestions = new Map<number, { recurrence: "weekly" | "monthly"; confidence: number }>();

  rows.forEach((row, idx) => {
    // Find existing transactions within ±1% of this amount
    const matches = existing.filter(tx =>
      tx.type === row.type &&
      Math.abs(Number(tx.amount) - row.amount) / row.amount < 0.01
    );
    if (matches.length < 1) return;

    // Check if any matches are ~30 days apart (monthly) or ~7 days apart (weekly)
    const rowDate = new Date(row.date);
    const hasMonthly = matches.some(tx => {
      const diff = Math.abs(rowDate.getTime() - new Date(tx.date).getTime());
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 25 && days <= 35;
    });
    const hasWeekly = matches.some(tx => {
      const diff = Math.abs(rowDate.getTime() - new Date(tx.date).getTime());
      const days = diff / (1000 * 60 * 60 * 24);
      return days >= 5 && days <= 9;
    });

    if (hasMonthly) suggestions.set(idx, { recurrence: "monthly", confidence: 0.85 });
    else if (hasWeekly) suggestions.set(idx, { recurrence: "weekly", confidence: 0.85 });
  });

  return suggestions;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;
type Mode = "csv" | "ai";

export function ImportView() {
  const { accounts, loading: accountsLoading, createAccount } = useAccounts();
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
  const [statementMeta, setStatementMeta]       = useState<StatementMeta | null>(null);
  const [smartCardCollapsed, setSmartCardCollapsed] = useState(false);
  const [excludeTransfers, setExcludeTransfers] = useState(true);

  // Duplicate detection
  type RowWithDup = ParsedRow & { isDuplicate?: boolean };
  const [rowsWithDups, setRowsWithDups] = useState<RowWithDup[]>([]);
  const [checkedRows, setCheckedRows]   = useState<Set<number>>(new Set());

  // Recurring detection
  const [recurringSuggestions, setRecurringSuggestions] = useState<Map<number, { recurrence: "weekly" | "monthly"; confidence: number }>>(new Map());
  const [recurringOverrides, setRecurringOverrides]     = useState<Map<number, boolean>>(new Map());

  /** Import preview table: 0 = show all rows on one page */
  const [previewPage, setPreviewPage]         = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(25);

  // Shared
  const [accountId,  setAccountId]  = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [importing, setImporting]   = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Auto-select account when statement meta + accounts are both ready ──────
  useEffect(() => {
    if (accountId || accountsLoading || !statementMeta?.bankName || accounts.length === 0) return;
    const match = accounts.find(a =>
      a.name.toLowerCase().includes(statementMeta.bankName!.toLowerCase())
    );
    if (match) setAccountId(String(match.id));
  }, [statementMeta, accounts, accountsLoading]);

  // ── File handling ──────────────────────────────────────────────────────────

  const SUPPORTED_EXTS = [".csv", ".pdf", ".xlsx", ".xls", ".ofx", ".qfx", ".txt"];

  // Manual CSV fallback (option C) — runs only if AI fails on a CSV
  const parseCSVManually = useCallback((file: File) => {
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
        setColMap(detected); setAutoDetected(true); setIsMint(detected.mintCategory !== -1);
      } else {
        setColMap(null); setAutoDetected(false); setIsMint(false);
        setManualDate("0");
        setManualDesc(hdrs.length > 1 ? "1" : "0");
        setManualAmount(hdrs.length > 2 ? "2" : "0");
        setManualType("-1");
      }
      setMode("csv");
    };
    reader.readAsText(file);
  }, []);

  const processFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (!SUPPORTED_EXTS.some(e => name.endsWith(e))) {
      toast.error("Unsupported file type. Upload CSV, PDF, XLSX, OFX, QFX, or TXT.");
      return;
    }
    setFileName(file.name);
    setFileObj(file);
    setMode("ai");
    setStep(2);
    // Option C: AI for all formats; CSV falls back to manual if AI fails
    const isCSV = name.endsWith(".csv");
    runAIParse(file, isCSV ? () => parseCSVManually(file) : undefined);
  }, [parseCSVManually]);

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

  const runAIParse = async (overrideFile?: File, onFail?: () => void) => {
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
      setStatementMeta(json.data.meta ?? null);
      setSmartCardCollapsed(false);
      toast.success(`AI extracted ${rows.length} transactions`);
      await checkDuplicates(rows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI parsing failed";
      // Auth failures fire auth:expired → redirect to /login. No toast needed — it would
      // flash briefly before redirect and confuse the user.
      const isAuthFailure = ["Token expired", "Unauthorized", "Missing token", "Invalid token"].some(s => msg.includes(s));
      if (isAuthFailure) return;

      if (onFail) {
        // CSV option C: AI failed, manual column detection available
        toast.info("AI unavailable — using column detection");
        onFail();
      } else {
        // Non-text format (PDF, XLSX, OFX…): can't manually parse, go back to upload
        toast.error(msg);
        setStep(1);
      }
    } finally {
      setAiParsing(false);
    }
  };

  // ── Duplicate detection ────────────────────────────────────────────────────

  const checkDuplicates = async (rows: ParsedRow[]) => {
    try {
      const res  = await authFetch("/api/v1/transactions?perPage=200");
      const json = await res.json();
      const existing: Transaction[] = json.success ? (json.data?.rows ?? []) : [];

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

      // Run recurring detection with the same existing transactions
      const suggestions = detectRecurring(rows, existing);
      setRecurringSuggestions(suggestions);
      // Pre-accept all suggestions (user can dismiss individually)
      const overrides = new Map<number, boolean>();
      suggestions.forEach((_, idx) => overrides.set(idx, true));
      setRecurringOverrides(overrides);
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

  const csvPreviewRows = mode === "csv" ? buildRows(allRows, effectiveColMap).valid : [];
  const aiPreviewRows  = mode === "ai"  ? (rowsWithDups.length > 0 ? rowsWithDups : aiRows) : [];
  const previewRows    = mode === "ai"  ? aiPreviewRows : csvPreviewRows;

  const previewShowAll   = previewPageSize === 0;
  const previewSliceSize = previewShowAll ? previewRows.length : previewPageSize;
  const previewTotalPages = Math.max(1, Math.ceil(previewRows.length / Math.max(previewSliceSize, 1)));
  const previewSafePage   = Math.min(previewPage, previewTotalPages);
  const previewStartIdx   = (previewSafePage - 1) * previewSliceSize;
  const previewPageRows   = previewRows.slice(previewStartIdx, previewStartIdx + previewSliceSize);

  useEffect(() => {
    setPreviewPage(1);
  }, [fileName, previewRows.length]);

  useEffect(() => {
    setPreviewPage(p => Math.min(p, previewTotalPages));
  }, [previewTotalPages]);

  // Summary counts for AI mode
  const dupCount      = rowsWithDups.filter(r => r.isDuplicate).length;
  const newCount      = rowsWithDups.filter(r => !r.isDuplicate).length;
  const checkedCount  = checkedRows.size;

  // ── Auto-collapse smart card when account first selected ──────────────────
  useEffect(() => {
    if (accountId && mode === "ai" && !smartCardCollapsed) {
      if (excludeTransfers && rowsWithDups.length > 0) {
        setCheckedRows(prev => {
          const next = new Set(prev);
          rowsWithDups.forEach((r, i) => { if (r.isTransfer) next.delete(i); });
          return next;
        });
      }
      setSmartCardCollapsed(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!accountId) { toast.error("Please select an account"); return; }
    if (mode === "ai" && rowsWithDups.length > 0 && checkedRows.size === 0) {
      toast.error("No transactions selected. Check at least one row to import.");
      return;
    }

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

    // Enrich rows with recurring metadata (AI mode only).
    // In AI mode validRows were built by filtering rowsWithDups by checkedRows,
    // so we rebuild with original indices preserved.
    let enrichedRows: (ParsedRow & { isRecurring?: boolean; recurrence?: string; nextDue?: string })[];
    if (mode === "ai" && rowsWithDups.length > 0) {
      enrichedRows = [];
      rowsWithDups.forEach((row, idx) => {
        if (!checkedRows.has(idx)) return;
        const suggestion = recurringSuggestions.get(idx);
        if (suggestion && recurringOverrides.get(idx) === true) {
          const daysToAdd = suggestion.recurrence === "monthly" ? 30 : 7;
          const nextDue = new Date(new Date(row.date).getTime() + daysToAdd * 24 * 60 * 60 * 1000)
            .toISOString().slice(0, 10);
          enrichedRows.push({ ...row, isRecurring: true, recurrence: suggestion.recurrence, nextDue });
        } else {
          enrichedRows.push(row);
        }
      });
    } else {
      enrichedRows = validRows;
    }

    setImporting(true);
    try {
      const body: Record<string, unknown> = {
        transactions: enrichedRows,
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
    setAiRows([]); setAiModel(""); setStatementMeta(null);
    setSmartCardCollapsed(false); setExcludeTransfers(true);
    setRowsWithDups([]); setCheckedRows(new Set());
    setRecurringSuggestions(new Map()); setRecurringOverrides(new Map());
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
          <p className="text-xs" style={{ color: "hsl(var(--ll-text-muted))" }}>Upload a bank statement (CSV, PDF, XLSX, OFX, QFX, TXT)</p>
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
                color: step >= s ? "hsl(var(--ll-accent-fg))" : "hsl(var(--ll-text-muted))",
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
                CSV · PDF · XLSX · OFX · QFX · TXT — Any bank
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.pdf,.xlsx,.xls,.ofx,.qfx,.txt" className="hidden" onChange={onFileChange} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "hsl(var(--ll-accent))" }} />
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                AI parses all formats automatically. CSV falls back to manual if needed.
              </p>
            </div>
            <a 
              href="https://ledgerlite.com/help/exports" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] font-medium underline opacity-60 hover:opacity-100" 
              style={{ color: "hsl(var(--ll-text-muted))" }}
            >
              How to export?
            </a>
          </div>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div className="space-y-4">

          {/* Status bar — hidden in AI mode once parsing is done (SmartSummaryCard takes over) */}
          {!(mode === "ai" && aiRows.length > 0) && <div className="ll-card p-5">
            <div className="flex items-start gap-3">
              {mode === "ai" && aiParsing ? (
                <div className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "hsl(var(--ll-accent))" }} />
              ) : mode === "ai" && aiRows.length > 0 ? (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-accent))" }} />
              ) : autoDetected ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ll-income))]" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ll-warning))]" />
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
          </div>}

          {/* Low-confidence warning */}
          {mode === "ai" && lowConfidenceCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "hsl(var(--ll-warning) / 0.08)", border: "1px solid hsl(var(--ll-warning) / 0.2)" }}>
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--ll-warning))]" />
              <p className="text-xs" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                {lowConfidenceCount} row{lowConfidenceCount !== 1 ? "s are" : " is"} flagged low-confidence. Review them before importing.
              </p>
            </div>
          )}

          {/* Smart Summary Card — always visible in AI mode; collapses to strip when account selected */}
          {mode === "ai" && aiRows.length > 0 && (
            <SmartSummaryCard
              meta={statementMeta}
              rows={aiRows}
              excludeTransfers={excludeTransfers}
              onExcludeTransfersChange={setExcludeTransfers}
              accounts={accounts}
              accountsLoading={accountsLoading}
              accountId={accountId}
              onAccountSelect={setAccountId}
              createAccount={createAccount}
              collapsed={smartCardCollapsed}
              onExpand={() => setSmartCardCollapsed(false)}
            />
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

          {/* Account + Category — hidden in AI mode (account via SmartSummaryCard, category per-row) */}
          {mode !== "ai" && <div className="ll-card p-5">
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Import settings</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                  Account <span className="text-[hsl(var(--ll-expense))]">*</span>
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
                  Default category <span style={{ color: "hsl(var(--ll-text-muted))" }}>(optional)</span>
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
          </div>}

          {/* Preview table */}
          {previewRows.length > 0 && (
            <div className="ll-card overflow-hidden p-0">
              <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid hsl(var(--ll-border))" }}>
                <h2 className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  Preview ({previewRows.length} row{previewRows.length !== 1 ? "s" : ""})
                </h2>
                {!previewShowAll && previewRows.length > 0 && (
                  <p className="mt-1 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    Showing{" "}
                    {previewPageRows.length === 0 ? 0 : previewStartIdx + 1}
                    –
                    {previewStartIdx + previewPageRows.length} of {previewRows.length}
                  </p>
                )}
              </div>
              <div
                className={
                  previewShowAll && previewRows.length > 40
                    ? "max-h-[min(70vh,720px)] overflow-y-auto overflow-x-auto"
                    : "overflow-x-auto"
                }
              >
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
                    {previewPageRows.map((row, i) => {
                      const globalIdx  = previewStartIdx + i;
                      const rowWithDup = row as RowWithDup;
                      const lowConf    = (row.confidence ?? 1) < 0.7;
                      const isDup      = rowWithDup.isDuplicate === true;
                      const isChecked  = checkedRows.has(globalIdx);
                      return (
                        <tr key={globalIdx} style={{
                          borderBottom: i < previewPageRows.length - 1 ? "1px solid hsl(var(--ll-border) / 0.5)" : undefined,
                          background: isDup
                            ? "hsl(var(--ll-warning) / 0.05)"
                            : lowConf ? "hsl(var(--ll-warning) / 0.04)" : undefined,
                          opacity: mode === "ai" && rowsWithDups.length > 0 && !isChecked ? 0.45 : 1,
                        }}>
                          {mode === "ai" && rowsWithDups.length > 0 && (
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const next = new Set(checkedRows);
                                  if (isChecked) next.delete(globalIdx); else next.add(globalIdx);
                                  setCheckedRows(next);
                                }}
                                className="h-3.5 w-3.5 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-4 py-2" style={{ color: "hsl(var(--ll-text-secondary))" }}>{row.date}</td>
                          <td className="px-4 py-2 max-w-[180px]" style={{ color: "hsl(var(--ll-text-primary))" }}>
                            <span className="block truncate">{row.description}</span>
                            {isDup && (
                              <span className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[hsl(var(--ll-warning)/0.15)] text-[hsl(var(--ll-warning))]">
                                Duplicate?
                              </span>
                            )}
                            {recurringSuggestions.has(globalIdx) && (
                              <span className="inline-flex items-center gap-1 mt-0.5">
                                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[hsl(var(--ll-accent)/0.1)] text-[hsl(var(--ll-accent))]">
                                  ↻ {recurringSuggestions.get(globalIdx)!.recurrence}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRecurringOverrides(prev => new Map(prev).set(globalIdx, !(prev.get(globalIdx) ?? false)))}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                                    recurringOverrides.get(globalIdx)
                                      ? "bg-[hsl(var(--ll-accent)/0.2)] text-[hsl(var(--ll-accent))]"
                                      : "bg-[hsl(var(--ll-accent)/0.05)] text-[hsl(var(--ll-text-muted))] line-through"
                                  }`}
                                  title={recurringOverrides.get(globalIdx) ? "Click to dismiss recurring" : "Click to accept recurring"}
                                >
                                  {recurringOverrides.get(globalIdx) ? "recurring" : "dismiss"}
                                </button>
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
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${lowConf ? "bg-[hsl(var(--ll-warning)/0.1)] text-[hsl(var(--ll-warning))]" : "bg-[hsl(var(--ll-income)/0.1)] text-[hsl(var(--ll-income))]"}`}>
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
              <div
                className="flex flex-col gap-2 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderColor: "hsl(var(--ll-border))" }}
              >
                <label className="flex items-center gap-2 text-[11px]" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                  <span style={{ color: "hsl(var(--ll-text-muted))" }}>Rows per page</span>
                  <select
                    className="ll-input h-7 py-0 text-xs"
                    value={previewPageSize === 0 ? "all" : String(previewPageSize)}
                    onChange={e => {
                      const v = e.target.value;
                      setPreviewPageSize(v === "all" ? 0 : parseInt(v, 10));
                      setPreviewPage(1);
                    }}
                  >
                    {[10, 25, 50, 100].map(n => (
                      <option key={n} value={String(n)}>{n}</option>
                    ))}
                    <option value="all">All</option>
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={previewSafePage <= 1}
                    onClick={() => setPreviewPage(Math.max(1, previewSafePage - 1))}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[hsl(var(--ll-text-secondary))] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "hsl(var(--ll-border))", background: "hsl(var(--ll-bg-elevated))" }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[7rem] text-center text-[11px] tabular-nums" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    Page {previewSafePage} of {previewTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={previewSafePage >= previewTotalPages}
                    onClick={() => setPreviewPage(Math.min(previewTotalPages, previewSafePage + 1))}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[hsl(var(--ll-text-secondary))] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "hsl(var(--ll-border))", background: "hsl(var(--ll-bg-elevated))" }}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {previewRows.length === 0 && !aiParsing && mode !== "ai" && (
            <div className="ll-card p-5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--ll-warning))]" />
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
                <>, <span style={{ color: "hsl(var(--ll-warning))" }}>{dupCount} possible duplicate{dupCount !== 1 ? "s" : ""} (unchecked)</span></>
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
      {step === 3 && !importResult && (
        <div className="ll-card p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "hsl(var(--ll-expense) / 0.12)" }}>
              <AlertCircle className="h-7 w-7" style={{ color: "hsl(var(--ll-expense))" }} />
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>Import failed</p>
              <p className="mt-1 text-sm" style={{ color: "hsl(var(--ll-text-secondary))" }}>Something went wrong during import. Please try again.</p>
            </div>
            <button onClick={reset} className="rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors" style={{ background: "hsl(var(--ll-accent))" }}>
              Try again
            </button>
          </div>
        </div>
      )}
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

// ─── Smart Summary Card ───────────────────────────────────────────────────────

interface SmartSummaryCardProps {
  meta:                    StatementMeta | null;
  rows:                    ParsedRow[];
  excludeTransfers:        boolean;
  onExcludeTransfersChange:(v: boolean) => void;
  accounts:                import("@/shared/types").Account[];
  accountsLoading:         boolean;
  accountId:               string;
  onAccountSelect:         (id: string) => void;
  createAccount:           (p: { name: string; type: string; startingBalance: number; colour: string }) => Promise<import("@/shared/types").Account>;
  collapsed:               boolean;
  onExpand:                () => void;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking:   "Checking",
  savings:    "Savings",
  cash:       "Cash",
  credit:     "Credit",
  investment: "Investment",
};
const ACCOUNT_TYPE_ORDER = ["checking", "savings", "cash", "credit", "investment"];

/** Non-null type-specific fields from AI meta (credit / savings / investment). */
function extendedStatementSummaryRows(
  meta: StatementMeta | null,
  formatYmd: (d: string | null) => string | null,
): { label: string; value: string }[] {
  if (!meta) return [];
  const cur = meta.currency ? `${meta.currency} ` : "";
  const money = (n: number | null) =>
    n == null ? null : `${cur}${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const out: { label: string; value: string }[] = [];
  const push = (label: string, v: string | null) => {
    if (v) out.push({ label, value: v });
  };
  push("Credit limit", money(meta.creditLimit));
  push("Available credit", money(meta.availableCredit));
  push("Minimum payment", money(meta.minimumPaymentDue));
  push("Minimum payment by", formatYmd(meta.minimumPaymentDueDate));
  push("Payment due", formatYmd(meta.paymentDueDate));
  if (meta.aprAnnualPercent != null) push("APR", `${meta.aprAnnualPercent}%`);
  push("Purchases & charges (stmt.)", money(meta.totalPurchasesAndCharges));
  push("Payments & credits (stmt.)", money(meta.totalPaymentsAndCredits));
  push("Fees (stmt.)", money(meta.totalFeesCharged));
  push("Interest (stmt.)", money(meta.totalInterestCharged));
  push("Outstanding balance", money(meta.outstandingBalance));
  if (meta.isNewAccount === true) push("New account", "Yes");
  push("Interest earned", money(meta.interestEarnedThisPeriod));
  if (meta.annualPercentageYield != null) push("APY / AER", `${meta.annualPercentageYield}%`);
  push("Portfolio value", money(meta.portfolioEndingValue));
  return out;
}

function SmartSummaryCard({
  meta, rows, excludeTransfers, onExcludeTransfersChange,
  accounts, accountsLoading, accountId, onAccountSelect, createAccount,
  collapsed, onExpand,
}: SmartSummaryCardProps) {
  const [creating, setCreating] = useState(false);

  const transferCount    = rows.filter(r => r.isTransfer).length;
  const totalCount       = rows.length;
  const nonTransferCount = totalCount - transferCount;

  // Find existing account matching detected bank name
  const suggestedAccount = meta?.bankName && !accountsLoading
    ? accounts.find(a => a.name.toLowerCase().includes(meta.bankName!.toLowerCase()))
    : null;

  // Build suggested create name: BankName-XXXX
  const shortAccNum = (meta?.accountNumber ?? "").replace(/[^0-9]/g, "").slice(-4);
  const suggestedName = shortAccNum
    ? `${meta?.bankName ?? "Bank"}-${shortAccNum}`
    : meta?.bankName ?? "Account";

  // Group accounts by type for optgroup rendering
  const grouped = ACCOUNT_TYPE_ORDER
    .map(type => ({ type, label: ACCOUNT_TYPE_LABELS[type], items: accounts.filter(a => a.type === type) }))
    .filter(g => g.items.length > 0);

  const handleCreateAccount = async () => {
    setCreating(true);
    try {
      const acct = await createAccount({
        name:            suggestedName,
        type:            meta?.accountType ?? "checking",
        startingBalance: meta?.openingBalance ?? 0,
        colour:          "#6366f1",
      });
      onAccountSelect(String(acct.id));
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const summaryExtras = extendedStatementSummaryRows(meta, formatDate);

  const hasAccountInfo = meta?.bankName || meta?.accountNumber;
  const hasPeriod      = meta?.statementFrom || meta?.statementTo;
  const hasTransfers   = transferCount > 0;
  const selectedAccount = accounts.find(a => String(a.id) === accountId);

  // ── Collapsed strip ──────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="ll-card px-4 py-3 flex items-center gap-3">
        <Building2 className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--ll-accent))" }} />
        <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs" style={{ color: "hsl(var(--ll-text-secondary))" }}>
          <span className="font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
            {selectedAccount?.name ?? meta?.bankName ?? "Account"}
          </span>
          {meta?.accountType && <span style={{ color: "hsl(var(--ll-text-muted))" }}>· {meta.accountType}</span>}
          {hasPeriod && (
            <span style={{ color: "hsl(var(--ll-text-muted))" }}>
              · {formatDate(meta?.statementFrom ?? null)} – {formatDate(meta?.statementTo ?? null)}
            </span>
          )}
          <span style={{ color: "hsl(var(--ll-text-muted))" }}>
            · {excludeTransfers ? nonTransferCount : totalCount} transaction{(excludeTransfers ? nonTransferCount : totalCount) !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={onExpand}
          className="flex-shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          style={{ background: "hsl(var(--ll-bg-elevated))", color: "hsl(var(--ll-text-secondary))", border: "1px solid hsl(var(--ll-border))" }}
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      </div>
    );
  }

  return (
    <div className="ll-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-5 py-3.5" style={{ borderColor: "hsl(var(--ll-border))" }}>
        <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--ll-accent))" }} />
        <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>
          AI detected {totalCount} transactions — review before importing
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: "hsl(var(--ll-border)/0.6)" }}>

        {/* Account section — always rendered so user can always pick an account */}
        <div className="flex items-start gap-3 px-5 py-4">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "hsl(var(--ll-accent)/0.1)" }}>
              <Building2 className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-accent))" }} />
            </div>
            <div className="flex-1 min-w-0">
              {hasAccountInfo ? (
                <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                  {[meta?.bankName, meta?.accountType, meta?.accountNumber].filter(Boolean).join(" · ")}
                  {meta?.currency && <span className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "hsl(var(--ll-accent)/0.1)", color: "hsl(var(--ll-accent))" }}>{meta.currency}</span>}
                </p>
              ) : (
                <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  Bank not detected
                </p>
              )}
              <p className="mt-0.5 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                Assign transactions to an account
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {accountsLoading ? (
                  <div className="ll-input h-7 text-xs flex items-center" style={{ minWidth: 160, color: "hsl(var(--ll-text-muted))" }}>Loading…</div>
                ) : (
                  <select
                    className="ll-input h-7 text-xs"
                    value={accountId}
                    onChange={e => onAccountSelect(e.target.value)}
                    style={{ minWidth: 160 }}
                  >
                    <option value="">Select existing…</option>
                    {grouped.map(g => (
                      <optgroup key={g.type} label={g.label}>
                        {g.items.map(a => (
                          <option key={a.id} value={String(a.id)}>
                            {a.name}{suggestedAccount?.id === a.id ? " ✓" : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                )}
                {!accountsLoading && !suggestedAccount && !accountId && (
                  <button
                    onClick={handleCreateAccount}
                    disabled={creating}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium disabled:opacity-50"
                    style={{ background: "hsl(var(--ll-accent)/0.1)", color: "hsl(var(--ll-accent))" }}
                  >
                    {creating ? "Creating…" : `+ Create "${suggestedName}"`}
                  </button>
                )}
              </div>
            </div>
          </div>

        {/* Statement period */}
        {hasPeriod && (
          <div className="flex items-start gap-3 px-5 py-4">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "hsl(var(--ll-income)/0.1)" }}>
              <Calendar className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-income))" }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                {formatDate(meta?.statementFrom ?? null)} – {formatDate(meta?.statementTo ?? null)}
              </p>
              {meta?.openingBalance != null && (
                <p className="mt-0.5 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                  Opening balance: <span className="font-medium">{meta.currency ?? ""} {meta.openingBalance.toLocaleString()}</span>
                  {meta.closingBalance != null && (
                    <> · Closing: <span className="font-medium">{meta.closingBalance.toLocaleString()}</span></>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {summaryExtras.length > 0 && (
          <div className="flex items-start gap-3 px-5 py-4">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "hsl(var(--ll-accent)/0.08)" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-accent))" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                Statement summary ({meta?.accountType ?? "account"})
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 text-[11px]">
                {summaryExtras.map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-3" style={{ color: "hsl(var(--ll-text-secondary))" }}>
                    <dt style={{ color: "hsl(var(--ll-text-muted))" }}>{label}</dt>
                    <dd className="font-medium tabular-nums text-right" style={{ color: "hsl(var(--ll-text-primary))" }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {/* Transfer detection */}
        {hasTransfers && (
          <div className="flex items-start gap-3 px-5 py-4">
            <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg" style={{ background: "hsl(var(--ll-warning)/0.1)" }}>
              <ArrowLeftRight className="h-3.5 w-3.5" style={{ color: "hsl(var(--ll-warning))" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium" style={{ color: "hsl(var(--ll-text-primary))" }}>
                    {transferCount} likely transfer{transferCount !== 1 ? "s" : ""} detected
                  </p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "hsl(var(--ll-text-muted))" }}>
                    {excludeTransfers
                      ? `Excluding — ${nonTransferCount} transactions will be imported`
                      : "Including — may cause double-counting"}
                  </p>
                </div>
                <button
                  onClick={() => onExcludeTransfersChange(!excludeTransfers)}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: excludeTransfers ? "hsl(var(--ll-income)/0.12)" : "hsl(var(--ll-expense)/0.1)",
                    color:      excludeTransfers ? "hsl(var(--ll-income))"      : "hsl(var(--ll-expense))",
                  }}
                >
                  {excludeTransfers ? "Excluding ✓" : "Including"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 px-5 py-3" style={{ background: "hsl(var(--ll-bg-elevated)/0.4)" }}>
          {[
            { label: "Extracted",     value: String(totalCount) },
            { label: "Will import",   value: String(excludeTransfers ? nonTransferCount : totalCount) },
            { label: "Low confidence",value: String(rows.filter(r => (r.confidence ?? 1) < 0.7).length) },
            ...(meta?.statementTransactionCount != null ? [{ label: "Statement total", value: String(meta.statementTransactionCount) }] : []),
          ].map(s => (
            <div key={s.label}>
              <p className="text-[10px]" style={{ color: "hsl(var(--ll-text-muted))" }}>{s.label}</p>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--ll-text-primary))" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Extraction completeness warning */}
        {meta?.statementTransactionCount != null && totalCount < meta.statementTransactionCount && (
          <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "hsl(var(--ll-warning)/0.08)", border: "1px solid hsl(var(--ll-warning)/0.25)" }}>
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-[hsl(var(--ll-warning))]" />
            <p className="text-[11px]" style={{ color: "hsl(var(--ll-text-secondary))" }}>
              Statement shows {meta.statementTransactionCount} transactions — AI extracted {totalCount}. The file may have been truncated or some rows were unreadable.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
