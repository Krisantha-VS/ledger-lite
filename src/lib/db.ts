import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

let _db: PrismaClient | undefined;

function createDb(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const adapter = new PrismaNeon({ connectionString });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

export const db = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    _db ??= createDb();
    return (_db as unknown as Record<string, unknown>)[prop];
  },
});
