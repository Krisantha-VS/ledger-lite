import { db } from "@/lib/db";
import { ok, notFound, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const UpdateSchema = z.object({
  amount:     z.number().positive().optional(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note:       z.string().max(300).nullable().optional(),
  categoryId: z.number().int().positive().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);
    const body   = UpdateSchema.parse(await req.json());

    const existing = await db.transaction.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    const data: Record<string, unknown> = { ...body };
    if (body.date) data.date = new Date(body.date + "T00:00:00Z");

    return ok(await db.transaction.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);

    const existing = await db.transaction.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    await db.transaction.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return handleError(e); }
}
