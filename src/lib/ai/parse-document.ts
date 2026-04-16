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

  /** Credit / revolving — only when statement shows these; else null */
  creditLimit:               number | null;
  availableCredit:           number | null;
  minimumPaymentDue:         number | null;
  minimumPaymentDueDate:     string | null; // YYYY-MM-DD
  paymentDueDate:            string | null; // YYYY-MM-DD
  aprAnnualPercent:          number | null;
  totalPurchasesAndCharges:  number | null;
  totalPaymentsAndCredits:   number | null;
  totalFeesCharged:          number | null;
  totalInterestCharged:      number | null;
  outstandingBalance:        number | null; // printed current / revolving total if distinct from closingBalance
  isNewAccount:              boolean | null; // true only if the statement explicitly indicates a new account

  /** Savings — interest this cycle; null if not a savings statement or not shown */
  interestEarnedThisPeriod:  number | null;
  annualPercentageYield:     number | null;

  /** Investment — null if not an investment/brokerage statement or not shown */
  portfolioEndingValue:      number | null;
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
    "openingBalance": <number or null — previous/closing balance start of period; for credit cards often "previous balance">,
    "closingBalance": <number or null — end-of-period balance; for credit cards map "new balance", "closing balance", "statement balance" here>,
    "totalDebits": <number or null — statement-printed total outflows for the period (debits/withdrawals/charges aggregate as printed)>,
    "totalCredits": <number or null — statement-printed total inflows (credits/deposits/payments aggregate as printed)>,
    "statementTransactionCount": <integer count of transactions printed on statement, or null>,

    "creditLimit": <number or null — only for credit/revolving; total credit limit if printed>,
    "availableCredit": <number or null>,
    "minimumPaymentDue": <number or null>,
    "minimumPaymentDueDate": "YYYY-MM-DD or null",
    "paymentDueDate": "YYYY-MM-DD or null — due date for this statement payment if shown>",
    "aprAnnualPercent": <number or null — e.g. 19.99 for 19.99% APR; null if not stated>,
    "totalPurchasesAndCharges": <number or null — purchases + card charges/fees excluding interest if the statement shows a separate purchases total>,
    "totalPaymentsAndCredits": <number or null — payments, refunds, and reversal credits aggregate if printed>,
    "totalFeesCharged": <number or null>,
    "totalInterestCharged": <number or null>,
    "outstandingBalance": <number or null — use when the statement prints a distinct "current balance", "total outstanding", or revolving balance different from closingBalance; else null>,
    "isNewAccount": <true | false | null — true ONLY if the statement explicitly indicates a new account (e.g. "welcome", "new account", first statement); otherwise false or null>,

    "interestEarnedThisPeriod": <number or null — savings/deposit interest for this statement period>,
    "annualPercentageYield": <number or null — APY/AER as a percentage number e.g. 4.5 for 4.5%>,

    "portfolioEndingValue": <number or null — total portfolio / account value at statement date if investment/brokerage>
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

Type-specific meta (always include every key; use null when not applicable or not printed):
- **credit**: Map printed summary lines into meta: openingBalance = previous balance; closingBalance = new/statement balance. Fill totalPurchasesAndCharges / totalPaymentsAndCredits when the statement shows those subtotals (not guesses). totalDebits/totalCredits should mirror the statement's own "total debits/charges" and "total credits/payments" summary lines when present. If isNewAccount is true, you MUST set creditLimit when the limit appears anywhere on the statement; if the statement says new account but no limit is printed, creditLimit stays null.
- **checking**: Prefer openingBalance/closingBalance and totalDebits (withdrawals) / totalCredits (deposits) from printed summaries. Leave all credit-* and savings/investment extras null.
- **savings**: Fill interestEarnedThisPeriod and annualPercentageYield when shown; credit-* null unless it is actually a combined pack.
- **investment**: Fill portfolioEndingValue when shown; other type-specific fields null unless also printed.

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
- include every meta key shown in the schema above (use null for any value not found or not applicable)
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
  const bool = (v: unknown): boolean | null => {
    if (v === true) return true;
    if (v === false) return false;
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "true" || s === "yes" || s === "1") return true;
    if (s === "false" || s === "no" || s === "0") return false;
    return null;
  };
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

    creditLimit:               num(raw.creditLimit),
    availableCredit:           num(raw.availableCredit),
    minimumPaymentDue:         num(raw.minimumPaymentDue),
    minimumPaymentDueDate:     date(raw.minimumPaymentDueDate),
    paymentDueDate:            date(raw.paymentDueDate),
    aprAnnualPercent:          num(raw.aprAnnualPercent),
    totalPurchasesAndCharges:  num(raw.totalPurchasesAndCharges),
    totalPaymentsAndCredits:   num(raw.totalPaymentsAndCredits),
    totalFeesCharged:          num(raw.totalFeesCharged),
    totalInterestCharged:      num(raw.totalInterestCharged),
    outstandingBalance:        num(raw.outstandingBalance),
    isNewAccount:              bool(raw.isNewAccount),

    interestEarnedThisPeriod:  num(raw.interestEarnedThisPeriod),
    annualPercentageYield:     num(raw.annualPercentageYield),

    portfolioEndingValue:      num(raw.portfolioEndingValue),
  };
}

interface ParsedResponse {
  transactions: AIParsedRow[];
  meta:         StatementMeta | null;
  rawCount:     number;
}

function inferTxnYear(meta: StatementMeta | null): number | null {
  const yFrom = meta?.statementFrom?.slice(0, 4);
  const yTo   = meta?.statementTo?.slice(0, 4);
  const y = (yTo ?? yFrom) ? parseInt(String(yTo ?? yFrom), 10) : NaN;
  return Number.isFinite(y) ? y : null;
}

function parseTxnDate(raw: unknown, meta: StatementMeta | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Accept DD/MM[/YY|YYYY] (default DD/MM per prompt)
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (!m) return null;

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (!(dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12)) return null;

  let yyyy: number | null = null;
  if (m[3]) {
    const y = parseInt(m[3], 10);
    if (!Number.isFinite(y)) return null;
    yyyy = m[3].length === 2 ? (2000 + y) : y;
  } else {
    yyyy = inferTxnYear(meta);
  }
  if (!yyyy) return null;

  const iso = `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function normaliseWithMeta(raw: unknown[], meta: StatementMeta | null): AIParsedRow[] {
  const rows: AIParsedRow[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;

    const date = parseTxnDate(r.date, meta);
    if (!date) continue;

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

function parseJSON(content: string): ParsedResponse {
  const cleaned = content.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  const raw = JSON.parse(cleaned);

  // New format: { meta, transactions }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Array.isArray(raw.transactions)) {
    const meta = raw.meta && typeof raw.meta === "object" ? normaliseMeta(raw.meta as Record<string, unknown>) : null;
    const txns = normaliseWithMeta(raw.transactions, meta);
    return { transactions: txns, meta, rawCount: raw.transactions.length };
  }

  // Fallback: plain array (old format or model non-compliance)
  const arr = Array.isArray(raw) ? raw : [];
  return { transactions: normaliseWithMeta(arr, null), meta: null, rawCount: arr.length };
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
