import { db } from "@/lib/db"
import { PlanType } from "@prisma/client"

// ── Entitlements ──────────────────────────────────────────────────────────────

export type Entitlements = {
  plan: PlanType
  aiImportsPerMonth: number       // 0 | 3 | Infinity
  maxAccounts: number             // 1 | 3 | Infinity
  maxMonthlyTransactions: number  // 50 | Infinity
  historyMonths: number           // 3 | 12 | Infinity
  maxGoals: number                // 1 | 3 | Infinity
  inGracePeriod: boolean
}

const LIMITS: Record<PlanType, Omit<Entitlements, "plan" | "inGracePeriod">> = {
  free: { aiImportsPerMonth: 0,        maxAccounts: 1, maxMonthlyTransactions: 50,       historyMonths: 3,        maxGoals: 1 },
  lite: { aiImportsPerMonth: 3,        maxAccounts: 3, maxMonthlyTransactions: Infinity,  historyMonths: 12,       maxGoals: 3 },
  pro:  { aiImportsPerMonth: Infinity, maxAccounts: Infinity, maxMonthlyTransactions: Infinity, historyMonths: Infinity, maxGoals: Infinity },
}

// ── Subscription helpers ──────────────────────────────────────────────────────

export async function getSubscription(userId: string) {
  let sub = await db.subscription.findUnique({ where: { userId } })

  if (!sub) {
    sub = await db.subscription.create({
      data: { userId, plan: "free", status: "active" },
    })
  }

  return sub
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const sub = await getSubscription(userId)
  const now = new Date()

  // Grace period: past_due but within grace window → treat as paid
  const inGracePeriod =
    sub.status === "past_due" &&
    sub.gracePeriodEndsAt != null &&
    sub.gracePeriodEndsAt > now

  // Effective plan: if past_due outside grace window → free
  let effectivePlan: PlanType = sub.plan
  if (sub.status === "past_due" && !inGracePeriod) effectivePlan = "free"
  if (sub.status === "canceled" && (!sub.currentPeriodEnd || sub.currentPeriodEnd < now)) effectivePlan = "free"

  return { plan: effectivePlan, ...LIMITS[effectivePlan], inGracePeriod }
}

export async function checkPlan(userId: string): Promise<PlanType> {
  const ent = await getEntitlements(userId)
  return ent.plan
}

// ── AI import counting ────────────────────────────────────────────────────────

export async function canUseAI(userId: string): Promise<boolean> {
  const ent = await getEntitlements(userId)
  return ent.aiImportsPerMonth > 0
}

export async function checkAndIncrementAiImport(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  const ent = await getEntitlements(userId)

  if (ent.aiImportsPerMonth === 0) return { allowed: false, remaining: 0 }
  if (ent.aiImportsPerMonth === Infinity) return { allowed: true, remaining: Infinity }

  const sub = await getSubscription(userId)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Reset counter if it's a new month
  if (!sub.aiImportResetAt || sub.aiImportResetAt < monthStart) {
    await db.subscription.update({
      where: { userId },
      data: { aiImportCount: 0, aiImportResetAt: monthStart },
    })
    sub.aiImportCount = 0
  }

  const count = sub.aiImportCount ?? 0
  if (count >= ent.aiImportsPerMonth) {
    return { allowed: false, remaining: 0 }
  }

  await db.subscription.update({
    where: { userId },
    data: { aiImportCount: { increment: 1 } },
  })

  return { allowed: true, remaining: ent.aiImportsPerMonth - count - 1 }
}
