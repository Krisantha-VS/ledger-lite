import { ok, fail, handleError, getUserId } from "@/lib/api";
import { getEntitlements } from "@/lib/subscriptions";
import { callAI, parseAIJson } from "@/lib/ai/suggestions";
import { GOAL_COACH_SYSTEM } from "@/lib/ai/prompts/goal-coach";
import { db } from "@/lib/db";

export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const ent = await getEntitlements(userId);
    if (ent.plan === "free") return fail("Goal coaching requires a paid plan.", 403);

    const { goalId } = await req.json() as { goalId: number };
    if (!goalId) return fail("goalId required", 400);

    const goal = await db.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== userId) return fail("Goal not found", 404);

    const targetAmount = Number(goal.targetAmount);
    const current = goal.isCompleted ? targetAmount : 0; // base — client sends actual

    // Compute monthly contribution rate from recent account activity
    let monthlyContrib = 0;
    if (goal.accountId) {
      const since = new Date();
      since.setMonth(since.getMonth() - 3);
      const incomeRows = await db.transaction.findMany({
        where: { userId, accountId: goal.accountId, type: "income", deletedAt: null, date: { gte: since } },
        select: { amount: true },
      });
      const totalIncome = incomeRows.reduce((s, r) => s + Number(r.amount), 0);
      monthlyContrib = Math.round(totalIncome / 3);
    }

    const daysLeft = goal.targetDate
      ? Math.max(0, Math.round((new Date(goal.targetDate).getTime() - Date.now()) / 86400000))
      : null;
    const monthsLeft = daysLeft != null ? Math.round(daysLeft / 30) : null;
    const remaining = Math.max(0, targetAmount - current);

    const user = `Goal: "${goal.name}"
Target amount: $${targetAmount}
Current saved: $${current}
Remaining: $${remaining}
Target date: ${goal.targetDate ? new Date(goal.targetDate).toDateString() : "No deadline set"}
${monthsLeft != null ? `Months left: ${monthsLeft}` : ""}
${monthlyContrib > 0 ? `Recent monthly contribution rate: $${monthlyContrib}/month` : ""}
Goal completed: ${goal.isCompleted}`;

    const content = await callAI({ system: GOAL_COACH_SYSTEM, user, maxTokens: 256 });
    const parsed = parseAIJson<{ message: string; sentiment: string }>(
      content,
      { message: `${Math.round((current / targetAmount) * 100)}% complete — keep going!`, sentiment: "on_track" }
    );

    return ok({ message: parsed.message, sentiment: parsed.sentiment });
  } catch (e) {
    if (e instanceof Error && e.message.includes("No AI provider")) return fail("AI not configured.", 503);
    return handleError(e);
  }
}
