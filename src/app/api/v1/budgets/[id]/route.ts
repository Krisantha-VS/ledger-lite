import { db } from "@/lib/db";
import { ok, notFound, handleError, getUserId } from "@/lib/api";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);

    const existing = await db.budget.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    await db.budget.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return handleError(e); }
}
