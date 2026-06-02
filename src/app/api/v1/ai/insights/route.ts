import { ok, fail, handleError, getUserId } from "@/lib/api";
import { getEntitlements } from "@/lib/subscriptions";
import { callAI, parseAIJson } from "@/lib/ai/suggestions";
import { SPENDING_INSIGHTS_SYSTEM } from "@/lib/ai/prompts/spending-insights";
import { db } from "@/lib/db";

export const maxDuration = 30;

export interface Insight {
  id:           string;
  title:        string;
  body:         string;
  type:         "saving" | "warning" | "trend" | "achievement";
  metric:       string;
  actionLabel?: string;
  actionHref?:  string;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const ent = await getEntitlements(userId);
    if (ent.plan === "free") return fail("Insights require a paid plan.", 403);

    const maxInsights = ent.plan === "pro" ? 5 : 2;

    // 3 months of expense transactions with category info
    const since = new Date();
    since.setMonth(since.getMonth() - 3);

    const transactions = await db.transaction.findMany({
      where: { userId, type: "expense", deletedAt: null, date: { gte: since } },
      select: { categoryId: true, amount: true, date: true, note: true, isRecurring: true },
      orderBy: { date: "asc" },
    });

    if (transactions.length < 10) {
      return ok({ insights: [], generatedAt: new Date().toISOString(), reason: "Not enough data yet — import 2+ months of transactions." });
    }

    const categories = await db.category.findMany({
      where: { userId },
      select: { id: true, name: true, type: true },
    });
    const catMap = new Map(categories.map(c => [c.id, c]));

    // Aggregate by category + month
    const now = new Date();
    const months = [-2, -1, 0].map(offset => {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    });

    const monthlyByCategory: Record<string, Record<string, number>> = {};
    for (const tx of transactions) {
      const month = tx.date.toISOString().slice(0, 7);
      if (!months.includes(month)) continue;
      const cat = catMap.get(tx.categoryId)?.name ?? "Other";
      monthlyByCategory[cat] ??= {};
      monthlyByCategory[cat][month] = (monthlyByCategory[cat][month] ?? 0) + Number(tx.amount);
    }

    // Month-over-month deltas for current vs previous month
    const currentMonth = months[2];
    const prevMonth    = months[1];
    const deltas: { category: string; currentMonth: number; prevMonth: number; pctChange: number }[] = [];
    for (const [cat, byMonth] of Object.entries(monthlyByCategory)) {
      const cur  = byMonth[currentMonth] ?? 0;
      const prev = byMonth[prevMonth] ?? 0;
      if (prev > 0) deltas.push({ category: cat, currentMonth: Math.round(cur), prevMonth: Math.round(prev), pctChange: Math.round(((cur - prev) / prev) * 100) });
    }
    deltas.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

    // Subscriptions (recurring)
    const subscriptions = transactions.filter(t => t.isRecurring).slice(0, 10).map(t => ({
      description: t.note ?? catMap.get(t.categoryId)?.name ?? "Subscription",
      amount: Number(t.amount),
    }));

    // Goals progress
    const goals = await db.goal.findMany({
      where: { userId, isCompleted: false },
      select: { name: true, targetAmount: true, targetDate: true },
      take: 3,
    });

    const userData = {
      period: `${months[0]} to ${months[2]}`,
      topChanges: deltas.slice(0, 5),
      subscriptions: { count: subscriptions.length, totalMonthly: Math.round(subscriptions.reduce((s, x) => s + x.amount, 0) / 3), items: subscriptions },
      goals: goals.map(g => ({ name: g.name, target: Number(g.targetAmount), daysLeft: g.targetDate ? Math.round((new Date(g.targetDate).getTime() - Date.now()) / 86400000) : null })),
    };

    const user = `Analyse this user's financial data and generate ${maxInsights} insights:\n${JSON.stringify(userData, null, 2)}`;
    const content = await callAI({ system: SPENDING_INSIGHTS_SYSTEM, user, maxTokens: 1500, useSonnet: true });

    const parsed = parseAIJson<{ insights: Insight[] }>(content, { insights: [] });
    const insights = (parsed.insights ?? []).slice(0, maxInsights).map((ins, i) => ({
      ...ins,
      id: `insight-${i}`,
    }));

    return ok({ insights, generatedAt: new Date().toISOString() });
  } catch (e) {
    if (e instanceof Error && e.message.includes("No AI provider")) return ok({ insights: [], generatedAt: new Date().toISOString() });
    return handleError(e);
  }
}
