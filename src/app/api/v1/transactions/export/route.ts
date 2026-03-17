import { db } from "@/lib/db";
import { handleError, getUserId } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const url    = new URL(req.url);
    const p      = url.searchParams;

    const where: Record<string, unknown> = { userId, deletedAt: null };
    if (p.get("accountId"))  where.accountId  = parseInt(p.get("accountId")!);
    if (p.get("type"))       where.type       = p.get("type");
    if (p.get("dateFrom") || p.get("dateTo")) {
      where.date = {} as Record<string, Date>;
      if (p.get("dateFrom")) (where.date as Record<string, Date>).gte = new Date(p.get("dateFrom")!);
      if (p.get("dateTo"))   (where.date as Record<string, Date>).lte = new Date(p.get("dateTo")!);
    }

    const rows = await db.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "desc" }],
      take: 10_000,
      include: {
        category: { select: { name: true, icon: true } },
        account:  { select: { name: true } },
      },
    });

    const header = ["Date", "Type", "Account", "Category", "Amount", "Note", "Recurring"].join(",");
    const lines  = rows.map(r => [
      new Date(r.date).toISOString().slice(0, 10),
      r.type,
      `"${r.account.name.replace(/"/g, '""')}"`,
      `"${r.category.name.replace(/"/g, '""')}"`,
      Number(r.amount).toFixed(2),
      `"${(r.note ?? "").replace(/"/g, '""')}"`,
      r.isRecurring ? "yes" : "no",
    ].join(","));

    const csv = [header, ...lines].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type":        "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ledgerlite-transactions-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  } catch (e) { return handleError(e); }
}
