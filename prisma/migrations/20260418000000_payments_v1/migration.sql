-- payments_v1: extend Subscription + add CheckoutIntent, PaymentEvent, EmailLog, FoundingCounter
-- Idempotent — safe to re-run on Neon.

-- ─── Extend Subscription ────────────────────────────────────────────────────

ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "billing"            VARCHAR(10),
  ADD COLUMN IF NOT EXISTS "email"              VARCHAR(254),
  ADD COLUMN IF NOT EXISTS "lastEventAt"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gracePeriodEndsAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "aiImportCount"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "aiImportResetAt"    TIMESTAMP(3);

-- ─── CheckoutIntent ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "CheckoutIntent" (
  "id"        TEXT          NOT NULL,
  "userId"    VARCHAR(36)   NOT NULL,
  "traceId"   VARCHAR(36)   NOT NULL,
  "plan"      VARCHAR(20)   NOT NULL,
  "billing"   VARCHAR(10)   NOT NULL,
  "email"     VARCHAR(254),
  "founding"  BOOLEAN       NOT NULL DEFAULT false,
  "consumed"  BOOLEAN       NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3)  NOT NULL,
  "createdAt" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CheckoutIntent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CheckoutIntent_userId_idx" ON "CheckoutIntent"("userId");

-- ─── PaymentEvent ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PaymentEvent" (
  "id"              SERIAL        NOT NULL,
  "traceId"         VARCHAR(36)   NOT NULL,
  "provider"        TEXT          NOT NULL DEFAULT 'dodo',
  "eventId"         VARCHAR(120)  NOT NULL,
  "eventType"       VARCHAR(60)   NOT NULL,
  "userId"          VARCHAR(36),
  "dodoSubId"       VARCHAR(100),
  "receivedAt"      TIMESTAMP(3)  NOT NULL,
  "processedAt"     TIMESTAMP(3),
  "processingError" TEXT,
  "quarantined"     BOOLEAN       NOT NULL DEFAULT false,
  "payloadHash"     VARCHAR(64),

  CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_eventId_key" ON "PaymentEvent"("eventId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_traceId_idx"  ON "PaymentEvent"("traceId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_userId_idx"   ON "PaymentEvent"("userId");

-- ─── EmailLog ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id"               SERIAL        NOT NULL,
  "traceId"          VARCHAR(36)   NOT NULL,
  "userId"           VARCHAR(36)   NOT NULL,
  "to"               VARCHAR(254)  NOT NULL,
  "templateId"       VARCHAR(60)   NOT NULL,
  "royaldaMessageId" VARCHAR(120),
  "sentAt"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt"      TIMESTAMP(3),
  "bouncedAt"        TIMESTAMP(3),
  "failedAt"         TIMESTAMP(3),
  "failReason"       VARCHAR(300),

  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailLog_traceId_idx" ON "EmailLog"("traceId");
CREATE INDEX IF NOT EXISTS "EmailLog_userId_idx"  ON "EmailLog"("userId");

-- ─── FoundingCounter ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "FoundingCounter" (
  "id"    INTEGER NOT NULL DEFAULT 1,
  "count" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "FoundingCounter_pkey" PRIMARY KEY ("id")
);

INSERT INTO "FoundingCounter" ("id", "count") VALUES (1, 0)
  ON CONFLICT ("id") DO NOTHING;
