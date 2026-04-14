import { ok, fail, handleError, getUserId } from "@/lib/api";
import { parseDocument } from "@/lib/ai/parse-document";

export const maxDuration = 60; // allow up to 60s for LLM parsing

export async function POST(req: Request) {
  try {
    await getUserId(req); // auth check

    const hasAI = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.DEEPSEEK_API_KEY;
    if (!hasAI) return fail("AI parsing is not configured", 503);

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return fail("Expected multipart/form-data", 400);
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail("No file provided", 400);
    }

    // Size guard: 10 MB max
    if (file.size > 10 * 1024 * 1024) {
      return fail("File too large (max 10 MB)", 413);
    }

    const allowedMimes = [
      "text/csv", "application/csv", "text/plain", "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/x-ofx", "application/ofx",
    ];
    const allowedExts = [".csv", ".pdf", ".xlsx", ".xls", ".ofx", ".qfx", ".txt"];
    const name = file.name.toLowerCase();
    const isAllowed =
      allowedMimes.some(t => file.type.includes(t)) ||
      allowedExts.some(e => name.endsWith(e));

    if (!isAllowed) {
      return fail("Unsupported file type. Upload CSV, PDF, XLSX, OFX, QFX, or TXT.", 415);
    }

    // Zero-disk-write: file lives in memory, never touches disk
    const result = await parseDocument(file);

    return ok({
      transactions: result.transactions,
      meta:         result.meta,
      provider:     result.provider,
      model:        result.model,
      rawCount:     result.rawCount,
      parsed:       result.transactions.length,
    });
  } catch (e) {
    console.error("[import/ai]", e);
    if (e instanceof SyntaxError) {
      return fail("AI returned an unreadable response. Please try again.", 502);
    }
    if (e instanceof Error && e.message.includes("scanned image")) {
      return fail(e.message, 422);
    }
    if (e instanceof Error) {
      return fail(e.message, 500);
    }
    return handleError(e);
  }
}
