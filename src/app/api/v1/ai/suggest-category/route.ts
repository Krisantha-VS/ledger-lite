import { ok, fail, handleError, getUserId } from "@/lib/api";
import { callAI, parseAIJson } from "@/lib/ai/suggestions";
import { CATEGORY_SUGGEST_SYSTEM } from "@/lib/ai/prompts/category-suggest";

export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    await getUserId(req);

    const { note, categories } = await req.json() as {
      note: string;
      categories: { id: number; name: string; type: string }[];
    };

    if (!note || note.trim().length < 3) return ok({ categoryId: null, confidence: 0 });
    if (!categories || categories.length === 0) return ok({ categoryId: null, confidence: 0 });

    const user = `Transaction note: "${note.trim().slice(0, 200)}"
Categories: ${JSON.stringify(categories.map(c => ({ id: String(c.id), name: c.name, type: c.type })))}`;

    const content = await callAI({ system: CATEGORY_SUGGEST_SYSTEM, user, maxTokens: 128 });
    const result  = parseAIJson<{ categoryId: string | null; confidence: number }>(content, { categoryId: null, confidence: 0 });

    const confidence = Math.min(1, Math.max(0, result.confidence ?? 0));
    if (confidence < 0.6) return ok({ categoryId: null, confidence });

    const catId = result.categoryId ? parseInt(result.categoryId, 10) : null;
    const valid = catId && categories.some(c => c.id === catId) ? catId : null;

    return ok({ categoryId: valid, confidence });
  } catch (e) {
    if (e instanceof Error && e.message.includes("No AI provider")) return ok({ categoryId: null, confidence: 0 });
    return handleError(e);
  }
}
