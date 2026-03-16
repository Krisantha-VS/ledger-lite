import { db } from "@/lib/db";
import { ok, handleError, getUserId } from "@/lib/api";
import { z } from "zod";

const CreateSchema = z.object({
  name:   z.string().min(1).max(80),
  icon:   z.string().default("Circle"),
  colour: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#94a3b8"),
  type:   z.enum(["income","expense","both"]).default("expense"),
});

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    const cats = await db.category.findMany({
      where: { userId },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
    return ok(cats);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    const body   = CreateSchema.parse(await req.json());
    const cat    = await db.category.create({ data: { userId, ...body } });
    return ok(cat, 201);
  } catch (e) { return handleError(e); }
}
