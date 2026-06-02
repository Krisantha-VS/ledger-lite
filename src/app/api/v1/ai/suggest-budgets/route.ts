import { ok, fail, handleError, getUserId } from "@/lib/api";
import { getEntitlements } from "@/lib/subscriptions";
import { callAI, parseAIJson } from "@/lib/ai/suggestions";
import { BUDGET_RECOMMEND_SYSTEM } from "@/lib/ai/prompts/budget-recommend";
import { db } from "@/lib/db";

export const maxDuration = 20;

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const ent = await getEntitlements(userId);
    if (ent.plan === "free") return fail("Budget suggestions require a paid plan.", 403);

    // Compute 3-month category spending averages
    const since = new Date();
    since.setMonth(since.getMonth() - 3);

    const transactions = await db.transaction.findMany({
      where: { userId, type: "expense", deletedAt: null, date: { gte: since } },
      select: { categoryId: true, amount: true },
    });

    const categories = await db.category.findMany({
      where: { userId, type: { in: ["expense", "both"] } },
      select: { id: true, name: true },
    });

    if (transactions.length < 5) {
      return ok({ suggestions: [], reason: "Not enough data yet — import at least 1 month of transactions." });
    }

    // Aggregate spend per category
    const spendMap = new Map<number, number>();
    for (const tx of transactions) {
      spendMap.set(tx.categoryId, (spendMap.get(tx.categoryId) ?? 0) + Number(tx.amount));
    }

    const catData = Array.from(spendMap.entries())
      .map(([categoryId, totalSpend]) => {
        const cat = categories.find(c => c.id === categoryId);
        if (!cat) return null;
        return { categoryId: String(categoryId), categoryName: cat.name, avg3MonthSpend: Math.round(totalSpend / 3) };
      })
      .filter(Boolean)
      .filter(c => c!.avg3MonthSpend >= 20);

    if (catData.length === 0) return ok({ suggestions: [], reason: "No significant spending categories found." });

    const user = `User's average monthly spending over the last 3 months:\n${JSON.stringify(catData, null, 2)}`;
    const content = await callAI({ system: BUDGET_RECOMMEND_SYSTEM, user, maxTokens: 1024 });

    const parsed = parseAIJson<{ suggestions: { categoryId: string; suggestedAmount: number; avgSpend: number; rationale: string }[] }>(
      content, { suggestions: [] }
    );

    // Validate categoryIds exist
    const validSuggestions = parsed.suggestions.filter(s => {
      const id = parseInt(s.categoryId, 10);
      return catData.some(c => c!.categoryId === String(id)) && s.suggestedAmount > 0;
    });

    return ok({ suggestions: validSuggestions });
  } catch (e) {
    if (e instanceof Error && e.message.includes("No AI provider")) return ok({ suggestions: [], reason: "AI not configured." });
    return handleError(e);
  }
}
