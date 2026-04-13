import OpenAI from "openai";

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const deepseek = new OpenAI({
  apiKey:  process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
});

export interface AIParsedRow {
  date:         string;   // YYYY-MM-DD
  description:  string;
  amount:       number;   // always positive
  type:         "income" | "expense";
  categoryName: string;
  confidence:   number;   // 0.0 – 1.0
}

export interface ParseResult {
  transactions: AIParsedRow[];
  provider:     string;
  model:        string;
  rawCount:     number;
}

// ─── Shared prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a financial data extraction assistant.
Extract every transaction from the bank statement provided.
Return ONLY a valid JSON array — no markdown, no commentary, no code fences.

Each item in the array must have exactly these fields:
{
  "date": "YYYY-MM-DD",
  "description": "cleaned merchant or payee name",
  "amount": <positive number, no currency symbols>,
  "type": "income" | "expense",
  "categoryName": "<best-guess category, e.g. Groceries, Utilities, Salary>",
  "confidence": <0.0 to 1.0>
}

Rules:
- amount must always be positive; use "type" to indicate direction
- date must be in YYYY-MM-DD format; infer the year from context if missing
- if you cannot confidently read a row, include it with confidence < 0.5
- do not omit rows; include every transaction you can see
- do not include opening/closing balance rows, only transactions`;

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

    rows.push({
      date,
      description:  String(r.description ?? "").slice(0, 300).trim() || "Unknown",
      amount:       Math.round(amount * 100) / 100,
      type:         r.type === "income" ? "income" : "expense",
      categoryName: String(r.categoryName ?? "Uncategorised").slice(0, 80).trim(),
      confidence:   Math.min(1, Math.max(0, parseFloat(String(r.confidence ?? "0.5")))),
    });
  }
  return rows;
}

function parseJSON(content: string): unknown[] {
  // Strip markdown code fences if model ignored instructions
  const cleaned = content.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  const raw = JSON.parse(cleaned);
  return Array.isArray(raw) ? raw : [];
}

// ─── CSV parse — OpenAI primary, DeepSeek fallback ───────────────────────────

export async function parseCSVWithAI(csvText: string): Promise<ParseResult> {
  const userMessage = `Extract all transactions from this CSV bank statement:\n\n${csvText.slice(0, 40_000)}`;

  // Primary: OpenAI GPT-4o-mini
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await openai.chat.completions.create({
        model:       "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      });
      const raw          = parseJSON(res.choices[0]?.message?.content ?? "[]");
      const transactions = normalise(raw);
      return { transactions, provider: "openai", model: "gpt-4o-mini", rawCount: raw.length };
    } catch (err) {
      console.warn("[parse-document] OpenAI CSV failed, falling back to DeepSeek:", err);
    }
  }

  // Fallback: DeepSeek-V3
  if (process.env.DEEPSEEK_API_KEY) {
    const res = await deepseek.chat.completions.create({
      model:       "deepseek-chat",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userMessage },
      ],
    });
    const raw          = parseJSON(res.choices[0]?.message?.content ?? "[]");
    const transactions = normalise(raw);
    return { transactions, provider: "deepseek", model: "deepseek-chat", rawCount: raw.length };
  }

  throw new Error("No AI provider configured. Add OPENAI_API_KEY or DEEPSEEK_API_KEY.");
}

// ─── PDF parse — extract text first, then use same LLM path as CSV ───────────

export async function parsePDFWithAI(pdfBuffer: Buffer): Promise<ParseResult> {
  // Use lib entry directly — v1 main index reads test files at require time
  // which crashes Next.js serverless. lib/pdf-parse.js skips that entirely.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (buf: Buffer) => Promise<{ text: string }>;

  const parsed = await pdfParse(pdfBuffer);
  const pdfText = parsed.text?.trim();

  if (!pdfText || pdfText.length < 20) {
    throw new Error("Could not extract text from this PDF. It may be a scanned image. Please export as CSV from your bank instead.");
  }

  // Reuse the same LLM path as CSV (OpenAI primary → DeepSeek fallback)
  const result = await parseCSVWithAI(pdfText);
  return { ...result, provider: result.provider + " (pdf)" };
}

// ─── Main router ──────────────────────────────────────────────────────────────

export async function parseDocument(file: File): Promise<ParseResult> {
  const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (isPDF) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return parsePDFWithAI(buffer);
  }

  return parseCSVWithAI(await file.text());
}
