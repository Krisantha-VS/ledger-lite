import OpenAI    from "openai";
import Anthropic from "@anthropic-ai/sdk";
import * as XLSX  from "xlsx";

const getOpenAI   = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const getDeepSeek  = () => new OpenAI({
  apiKey:  process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

export interface AIParsedRow {
  date:           string;        // YYYY-MM-DD
  description:    string;
  amount:         number;        // always positive
  type:           "income" | "expense";
  categoryName:   string;
  confidence:     number;        // 0.0 – 1.0
  isTransfer:     boolean;
  reference:      string | null; // bank-assigned transaction ID
  runningBalance: number | null; // balance after this transaction, if shown
}

export interface StatementMeta {
  bankName:                 string | null;
  accountNumber:            string | null;  // masked, e.g. ****4821
  accountType:              "checking" | "savings" | "credit" | "investment" | null;
  currency:                 string | null;  // ISO code e.g. LKR, USD
  statementFrom:            string | null;  // YYYY-MM-DD
  statementTo:              string | null;  // YYYY-MM-DD
  openingBalance:           number | null;
  closingBalance:           number | null;
  totalDebits:              number | null;  // sum of all debits per statement summary
  totalCredits:             number | null;  // sum of all credits per statement summary
  statementTransactionCount: number | null; // total count printed on statement
}

export interface ParseResult {
  transactions: AIParsedRow[];
  meta:         StatementMeta | null;
  provider:     string;
  model:        string;
  rawCount:     number;
}

// ─── Shared prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a financial data extraction assistant.
Analyse the bank statement and return a single JSON object — no markdown, no code fences.

The object must have exactly this structure:
{
  "meta": {
    "bankName": "string or null",
    "accountNumber": "masked number like ****4821, or null",
    "accountType": "checking | savings | credit | investment | null",
    "currency": "3-letter ISO code like LKR USD GBP, or null",
    "statementFrom": "YYYY-MM-DD or null",
    "statementTo": "YYYY-MM-DD or null",
    "openingBalance": <number or null>,
    "closingBalance": <number or null>,
    "totalDebits": <total debit/withdrawal sum printed on statement, or null>,
    "totalCredits": <total credit/deposit sum printed on statement, or null>,
    "statementTransactionCount": <integer count of transactions printed on statement, or null>
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "cleaned merchant or payee name",
      "amount": <positive number, no currency symbols>,
      "type": "income" | "expense",
      "categoryName": "<pick exactly one from the taxonomy below>",
      "confidence": <0.0 to 1.0>,
      "isTransfer": <true | false>,
      "reference": "bank-assigned transaction ID or reference number, or null",
      "runningBalance": <account balance after this transaction if shown, else null>
    }
  ]
}

Category taxonomy — you MUST use exactly one of these values for categoryName:
Groceries | Dining & Restaurants | Transport | Fuel | Utilities | Rent & Mortgage |
Healthcare | Insurance | Shopping | Entertainment | Travel | Education |
Subscriptions | Personal Care | Investments | Salary & Wages | Business Income |
Government & Tax | Transfer | Other

Account type detection — set accountType using the first matching rule:
- "credit"     if statement shows a credit limit, minimum payment due, APR, interest charges on balance, or revolving balance
- "savings"    if statement shows interest earned, a savings/deposit rate, or periodic interest credit rows
- "investment" if statement shows units, shares, NAV, portfolio value, dividends, or brokerage entries
- "checking"   for all other transactional accounts (current accounts, everyday accounts, etc.)

Rules:
- amount is always positive; use "type" for direction (income = money in, expense = money out)
- For credit card statements: purchases and fees are "expense"; payments and refunds are "income"
- date in YYYY-MM-DD; if year is missing, infer from statementFrom/statementTo range
- If day/month order is ambiguous, use the order consistent with most other dates in the statement; default to DD/MM
- confidence < 0.5 if you cannot confidently parse a row
- isTransfer: true if this transaction moves money between the account holder's own accounts, or is a self-directed loan repayment — regardless of language or keyword used
- do NOT include opening/closing balance rows or statement summary rows as transactions
- do NOT include reversed/voided transactions (a transaction immediately cancelled by an equal and opposite entry on the same date)
- include every other transaction row without omission
- all meta fields default to null if not found in the statement`;

// ─── Validate + normalise LLM output ─────────────────────────────────────────

function normalise(raw: unknown[]): AIParsedRow[] {
  const rows: AIParsedRow[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;

    const date = String(r.date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const amount = parseFloat(String(r.amount ?? "0"));
    if (isNaN(amount) || amount <= 0) continue;

    const rb = parseFloat(String(r.runningBalance ?? ""));
    rows.push({
      date,
      description:    String(r.description ?? "").slice(0, 300).trim() || "Unknown",
      amount:         Math.round(amount * 100) / 100,
      type:           r.type === "income" ? "income" : "expense",
      categoryName:   String(r.categoryName ?? "Other").slice(0, 80).trim(),
      confidence:     Math.min(1, Math.max(0, parseFloat(String(r.confidence ?? "0.5")))),
      isTransfer:     r.isTransfer === true,
      reference:      typeof r.reference === "string" && r.reference.trim() ? r.reference.trim().slice(0, 100) : null,
      runningBalance: isNaN(rb) ? null : Math.round(rb * 100) / 100,
    });
  }
  return rows;
}

function normaliseMeta(raw: Record<string, unknown>): StatementMeta {
  const str  = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num  = (v: unknown) => { const n = parseFloat(String(v ?? "")); return isNaN(n) ? null : n; };
  const date = (v: unknown) => { const s = str(v); return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };
  const acctTypes = ["checking", "savings", "credit", "investment"] as const;
  const rawType = str(raw.accountType)?.toLowerCase();
  return {
    bankName:                  str(raw.bankName),
    accountNumber:             str(raw.accountNumber),
    accountType:               acctTypes.find(t => t === rawType) ?? null,
    currency:                  str(raw.currency)?.toUpperCase().slice(0, 3) ?? null,
    statementFrom:             date(raw.statementFrom),
    statementTo:               date(raw.statementTo),
    openingBalance:            num(raw.openingBalance),
    closingBalance:            num(raw.closingBalance),
    totalDebits:               num(raw.totalDebits),
    totalCredits:              num(raw.totalCredits),
    statementTransactionCount: (() => { const n = parseInt(String(raw.statementTransactionCount ?? "")); return isNaN(n) ? null : n; })(),
  };
}

interface ParsedResponse {
  transactions: AIParsedRow[];
  meta:         StatementMeta | null;
  rawCount:     number;
}

function parseJSON(content: string): ParsedResponse {
  const cleaned = content.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  const raw = JSON.parse(cleaned);

  // New format: { meta, transactions }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.transactions)) {
    const txns = normalise(raw.transactions);
    const meta = raw.meta && typeof raw.meta === "object" ? normaliseMeta(raw.meta as Record<string, unknown>) : null;
    return { transactions: txns, meta, rawCount: raw.transactions.length };
  }

  // Fallback: plain array (old format or model non-compliance)
  const arr = Array.isArray(raw) ? raw : [];
  return { transactions: normalise(arr), meta: null, rawCount: arr.length };
}

// ─── CSV parse — OpenAI primary, DeepSeek fallback ───────────────────────────

export async function parseCSVWithAI(csvText: string): Promise<ParseResult> {
  const userMessage = `Extract all transactions from this CSV bank statement:\n\n${csvText.slice(0, 40_000)}`;

  // Primary: OpenAI GPT-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await getOpenAI().chat.completions.create({
        model:       "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      });
      const parsed = parseJSON(res.choices[0]?.message?.content ?? "{}");
      return { ...parsed, provider: "openai", model: "gpt-4o-mini" };
    } catch (err) {
      console.error("[parse-document] OpenAI GPT-4o-mini failed:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback: Anthropic Claude Haiku
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await getAnthropic().messages.create({
        model:       "claude-haiku-4-5-20251001",
        max_tokens:  4096,
        system:      SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const content = res.content[0]?.type === "text" ? res.content[0].text : "{}";
      const parsed  = parseJSON(content);
      return { ...parsed, provider: "anthropic", model: "claude-haiku-4-5" };
    } catch (err) {
      console.error("[parse-document] Anthropic Haiku failed:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback: DeepSeek-V3
  if (process.env.DEEPSEEK_API_KEY) {
    try {
      const res = await getDeepSeek().chat.completions.create({
        model:       "deepseek-chat",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      });
      const parsed = parseJSON(res.choices[0]?.message?.content ?? "{}");
      return { ...parsed, provider: "deepseek", model: "deepseek-chat" };
    } catch (err) {
      console.error("[parse-document] DeepSeek failed:", err instanceof Error ? err.message : err);
    }
  }

  throw new Error("No AI provider configured. Add OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY.");
}

// ─── PDF parse — extract text first, then use same LLM path as CSV ───────────

export async function parsePDFWithAI(pdfBuffer: Buffer): Promise<ParseResult> {
  // Use lib entry directly — v1 main index reads test files at require time
  // which crashes Next.js serverless. lib/pdf-parse.js skips that entirely.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;

  const parsed = await pdfParse(pdfBuffer);
  const pdfText = parsed.text?.trim();

  if (!pdfText || pdfText.replace(/\s+/g, "").length < 20) {
    throw new Error("Could not extract text from this PDF. It may be a scanned image. Please export as CSV from your bank instead.");
  }

  // Reuse the same LLM path as CSV (OpenAI → Anthropic → DeepSeek)
  const result = await parseCSVWithAI(pdfText);
  return { ...result, provider: result.provider + " (pdf)" };
}

// ─── XLSX → CSV text ──────────────────────────────────────────────────────────

function xlsxToCSV(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("Excel file contains no sheets.");
  return XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
}

// ─── Main router ──────────────────────────────────────────────────────────────

export async function parseDocument(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();

  // PDF — extract text then AI
  if (name.endsWith(".pdf")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return parsePDFWithAI(buffer);
  }

  // XLSX / XLS — convert to CSV text then AI
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const csv    = xlsxToCSV(buffer);
    if (!csv || csv.trim().length < 10) throw new Error("Could not extract data from this Excel file.");
    const result = await parseCSVWithAI(csv);
    return { ...result, provider: result.provider + " (xlsx)" };
  }

  // CSV, OFX, QFX, TXT, MT940 — all text-based, pass directly to AI
  return parseCSVWithAI(await file.text());
}
