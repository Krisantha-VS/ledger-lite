-- Subscription table + enums (production was missing this table, breaking Prisma queries)
-- Idempotent so a manual re-run on Neon is safe if needed.

DO $$ BEGIN
    CREATE TYPE "PlanType" AS ENUM ('free', 'lite', 'pro');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "SubStatus" AS ENUM ('active', 'past_due', 'canceled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR(36) NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'free',
    "status" "SubStatus" NOT NULL DEFAULT 'active',
    "dodoSubscriptionId" VARCHAR(100),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_dodoSubscriptionId_key" ON "Subscription"("dodoSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
