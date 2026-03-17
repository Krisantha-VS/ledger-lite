import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const UpdateSchema = z.object({
  currency: z.string().length(3).optional(),
  locale:   z.string().max(10).optional(),
  theme:    z.enum(["light", "dark", "system"]).optional(),
});

export async function GET(req: Request) {
  try {
    const userId  = await getUserId(req);
    const settings = await db.userSettings.upsert({
      where:  { userId },
      update: {},
      create: { userId },
    });
    return ok(settings);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getUserId(req);
    const body   = UpdateSchema.parse(await req.json());
    const settings = await db.userSettings.upsert({
      where:  { userId },
      update: body,
      create: { userId, ...body },
    });
    return ok(settings);
  } catch (e) { return handleError(e); }
}
