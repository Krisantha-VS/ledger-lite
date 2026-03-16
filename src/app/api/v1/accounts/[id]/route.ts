import { db } from "@/lib/db";
import { ok, notFound, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const UpdateSchema = z.object({
  name:   z.string().min(1).max(100).optional(),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
}).refine(d => Object.keys(d).length > 0, { message: "Nothing to update" });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);
    const body   = UpdateSchema.parse(await req.json());

    const existing = await db.account.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    const updated = await db.account.update({ where: { id }, data: body });
    return ok(updated);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);

    const existing = await db.account.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    await db.account.update({ where: { id }, data: { isArchived: true } });
    return ok({ deleted: true });
  } catch (e) { return handleError(e); }
}
