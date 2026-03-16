import { db } from "@/lib/db";
import { ok, notFound, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const UpdateSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  targetDate:   z.string().nullable().optional(),
  colour:       z.string().optional(),
  isCompleted:  z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);
    const body   = UpdateSchema.parse(await req.json());

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    const data: Record<string, unknown> = { ...body };
    if (body.targetDate !== undefined)
      data.targetDate = body.targetDate ? new Date(body.targetDate) : null;

    return ok(await db.goal.update({ where: { id }, data }));
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserId(req);
    const id     = parseInt((await params).id);

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    await db.goal.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return handleError(e); }
}
