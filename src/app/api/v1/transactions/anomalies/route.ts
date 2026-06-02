import { ok, handleError, getUserId } from "@/lib/api";
import { getEntitlements } from "@/lib/subscriptions";
import { callAI } from "@/lib/ai/suggestions";
import { ANOMALY_EXPLAIN_SYSTEM } from "@/lib/ai/prompts/anomaly-explain";
import { db } from "@/lib/db";

export const maxDuration = 15;

export interface Anomaly {
  transactionId: number;
  type:          "high_amount" | "duplicate" | "missing_income";
  severity:      "low" | "medium" | "high";
  explanation:   string;
  amount?:       number;
  description?:  string;
  date?:         string;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const ent = await getEntitlements(userId);
    const canExplain = ent.plan !== "free";

    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);

    const allTxns = await db.transaction.findMany({
      where: { userId, deletedAt: null, date: { gte: since90 } },
      select: { id: true, amount: true, note: true, date: true, type: true, categoryId: true, isRecurring: true },
      orderBy: { date: "desc" },
    });

    const recent  = allTxns.filter(t => t.date >= since30);
    const history = allTxns.filter(t => t.date < since30);

    const anomalies: Anomaly[] = [];

    // Rule 1: High amount — transaction > 2.5x 90-day payee/category average
    const groupHistory = new Map<string, number[]>();
    for (const tx of history) {
      const key = tx.note?.trim().toLowerCase() || `cat:${tx.categoryId}`;
      groupHistory.set(key, [...(groupHistory.get(key) ?? []), Number(tx.amount)]);
    }
    for (const tx of recent.filter(t => t.type === "expense")) {
      const key = tx.note?.trim().toLowerCase() || `cat:${tx.categoryId}`;
      const hist = groupHistory.get(key) ?? [];
      if (hist.length < 2) continue;
      const avg = hist.reduce((s, v) => s + v, 0) / hist.length;
      const ratio = Number(tx.amount) / avg;
      if (ratio > 2.5) {
        const severity = ratio > 5 ? "high" : ratio > 3.5 ? "medium" : "low";
        const templateMsg = `This charge ($${Number(tx.amount).toFixed(2)}) is ${ratio.toFixed(1)}× your usual amount of $${avg.toFixed(2)}.`;
        anomalies.push({
          transactionId: tx.id,
          type: "high_amount",
          severity,
          explanation: canExplain ? "" : templateMsg,
          amount: Number(tx.amount),
          description: tx.note ?? undefined,
          date: tx.date.toISOString().slice(0, 10),
        });
        if (canExplain) {
          try {
            const msg = await callAI({
              system: ANOMALY_EXPLAIN_SYSTEM,
              user:   `Transaction: "${tx.note ?? "Unknown"}" charged $${Number(tx.amount).toFixed(2)}. Usual amount for this payee: $${avg.toFixed(2)} average over last 3 months. Ratio: ${ratio.toFixed(1)}×.`,
              maxTokens: 120,
            });
            anomalies[anomalies.length - 1].explanation = msg.trim() || templateMsg;
          } catch {
            anomalies[anomalies.length - 1].explanation = templateMsg;
          }
        }
        if (anomalies.length >= 5) break; // cap at 5
      }
    }

    // Rule 2: Duplicate — same amount + same note within 3 days
    const seen = new Map<string, Date>();
    for (const tx of recent.filter(t => t.type === "expense")) {
      const key = `${Math.round(Number(tx.amount) * 100)}-${(tx.note ?? "").toLowerCase().trim()}`;
      const prev = seen.get(key);
      if (prev) {
        const diffDays = Math.abs(tx.date.getTime() - prev.getTime()) / 86400000;
        if (diffDays <= 3 && !anomalies.some(a => a.transactionId === tx.id)) {
          anomalies.push({
            transactionId: tx.id,
            type: "duplicate",
            severity: "medium",
            explanation: `You were charged $${Number(tx.amount).toFixed(2)} twice within 3 days — one might be a duplicate.`,
            amount: Number(tx.amount),
            description: tx.note ?? undefined,
            date: tx.date.toISOString().slice(0, 10),
          });
        }
      } else {
        seen.set(key, tx.date);
      }
    }

    return ok({ anomalies: anomalies.slice(0, 8), count: anomalies.length });
  } catch (e) {
    return handleError(e);
  }
}
