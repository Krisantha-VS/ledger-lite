import { db } from "@/lib/db";
import { ok, notFound, handleError, getUserId } from "@/lib/api";
import { getUserEmail } from "@/lib/auth";
import { z } from "zod";
import { sendMail } from "@/infrastructure/email/mailer";
import { goalCompletedEmail } from "@/infrastructure/email/templates";

const UpdateSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  targetDate:   z.string().nullable().optional(),
  colour:       z.string().optional(),
  isCompleted:  z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId    = await getUserId(req);
    const userEmail = await getUserEmail(req);
    const id        = parseInt((await params).id);
    const body      = UpdateSchema.parse(await req.json());

    const existing = await db.goal.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    const wasCompleted = existing.isCompleted;

    const data: Record<string, unknown> = { ...body };
    if (body.targetDate !== undefined)
      data.targetDate = body.targetDate ? new Date(body.targetDate) : null;

    const updated = await db.goal.update({ where: { id }, data });

    // ── Email trigger: goal just reached completed state ────────────────────
    if (userEmail && !wasCompleted && updated.isCompleted) {
      const { subject, html } = goalCompletedEmail({
        goalName:      updated.name,
        targetAmount:  Number(updated.targetAmount),
        currency:      "USD",
        completedDate: new Date().toISOString().slice(0, 10),
      });
      sendMail(userEmail, subject, html).catch(err => console.error("email error:", err));
    }

    return ok(updated);
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
