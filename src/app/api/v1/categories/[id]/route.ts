import { db } from "@/lib/db";
import { ok, fail, notFound, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const UpdateSchema = z.object({
  name:   z.string().min(1).max(80).optional(),
  icon:   z.string().optional(),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);
    const body   = UpdateSchema.parse(await req.json());

    const existing = await db.category.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    return ok(await db.category.update({ where: { id }, data: body }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);

    const existing = await db.category.findFirst({ where: { id, userId } });
    if (!existing) return notFound();
    if (existing.isSystem) return fail("Cannot delete system categories", 409);

    const inUse = await db.transaction.count({ where: { categoryId: id } });
    if (inUse > 0) return fail("Category has transactions — reassign first", 409);

    await db.category.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return handleError(e); }
}
