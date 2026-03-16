import { db } from "@/lib/db";
import { ok, fail, handleError, getUserId } from "@/lib/api";
import { DEFAULT_CATEGORIES } from "@/lib/categories";

export async function POST(req: Request) {
  // Seed endpoint disabled in production
  if (process.env.NODE_ENV === "production")
    return fail("Not available in production", 403);

  try {
    const userId = await getUserId(req);

    // Check if already seeded
    const count = await db.transaction.count({ where: { userId } });
    if (count > 0) return fail("Account already has data — seed only works on empty accounts", 409);

    // Ensure categories
    const existing = await db.category.count({ where: { userId } });
    if (existing === 0) {
      await db.category.createMany({
        data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId })),
        skipDuplicates: true,
      });
    }

    const cats = await db.category.findMany({ where: { userId } });
    const catMap = Object.fromEntries(cats.map(c => [c.name, c.id]));

    // Create 3 accounts
    const [checking, savings, cash] = await Promise.all([
      db.account.create({ data: { userId, name: "Main Checking", type: "checking", startingBalance: 2400, colour: "#6366f1" } }),
      db.account.create({ data: { userId, name: "Savings",       type: "savings",  startingBalance: 8500, colour: "#22c55e" } }),
      db.account.create({ data: { userId, name: "Cash Wallet",   type: "cash",     startingBalance: 150,  colour: "#f59e0b" } }),
    ]);

    // Generate 6 months of transactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txData: any[] = [];
    const today = new Date();

    for (let month = 5; month >= 0; month--) {
      const base = new Date(today.getFullYear(), today.getMonth() - month, 1);

      const d = (day: number) => new Date(base.getFullYear(), base.getMonth(), day);

      // Salary
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Salary"]!, type: "income", amount: 4200, date: d(1), note: "Monthly salary" });
      // Freelance (some months)
      if (month % 2 === 0)
        txData.push({ userId, accountId: checking.id, categoryId: catMap["Freelance"]!, type: "income", amount: 800 + Math.random() * 400, date: d(10), note: "Freelance project" });
      // Rent
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Housing"]!,  type: "expense", amount: 1350, date: d(3),  note: "Rent" });
      // Groceries
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Food & Dining"]!, type: "expense", amount: 180 + Math.random() * 60,  date: d(7),  note: "Weekly groceries" });
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Food & Dining"]!, type: "expense", amount: 160 + Math.random() * 50,  date: d(14), note: "Weekly groceries" });
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Food & Dining"]!, type: "expense", amount: 170 + Math.random() * 55,  date: d(21), note: "Weekly groceries" });
      // Utilities
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Utilities"]!, type: "expense", amount: 120 + Math.random() * 40, date: d(5), note: "Electric & internet" });
      // Transport
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Transport"]!, type: "expense", amount: 65 + Math.random() * 20, date: d(15), note: "Monthly transit pass" });
      // Entertainment
      txData.push({ userId, accountId: cash.id, categoryId: catMap["Entertainment"]!, type: "expense", amount: 40 + Math.random() * 30, date: d(20), note: "Weekend outing" });
      // Savings transfer
      txData.push({ userId, accountId: checking.id, categoryId: catMap["Investment"]!, type: "transfer", amount: 500, date: d(2), transferToId: savings.id, note: "Monthly savings" });
    }

    await db.transaction.createMany({ data: txData });

    // Add a goal
    await db.goal.create({ data: { userId, accountId: savings.id, name: "Emergency Fund", targetAmount: 15000, colour: "#6366f1" } });

    return ok({ message: "Demo data loaded", transactions: txData.length });
  } catch (e) { return handleError(e); }
}
