# LedgerLite Support Runbook

## Payment System Overview

- **Processor:** Dodo Payments (Merchant of Record — they handle VAT/tax)
- **Webhook endpoint:** `POST /api/v1/webhooks/dodo`
- **Audit trail:** `PaymentEvent` table (append-only, idempotent by `eventId`)
- **Email logs:** `EmailLog` table, delivery status updated by `POST /api/v1/webhooks/royalda`
- **Dunning cron:** `GET /api/v1/cron/dunning` — runs daily at 09:00 UTC via Vercel Cron

---

## Subscription States

| Status | Meaning |
|--------|---------|
| `active` | Paid and current |
| `past_due` | Payment failed — 7-day grace period active |
| `canceled` | Cancelled (access until `currentPeriodEnd`) |

Grace period: user retains paid access for 7 days after `subscription.failed`. Dunning emails sent at day 0 and day 3. Downgraded to free on day 7 if not resolved.

---

## Common Issues

### User says they paid but account shows free

1. Check `PaymentEvent` table for their `userId` or email — look for `quarantined: true`
2. If quarantined: `intentId` in metadata was missing/expired. Webhook couldn't resolve userId.
   - Fix: manually upsert their `Subscription` to the correct plan.
3. If no event at all: webhook may not be reaching us. Check Dodo dashboard → Developers → Webhook logs.
4. If event exists and processed: check `Subscription` table directly — may be a UI cache issue.

### User did not receive receipt email

1. Check `EmailLog` table: `SELECT * FROM "EmailLog" WHERE "userId" = '...' ORDER BY "sentAt" DESC`
2. If `failedAt` is set: check `failReason` — usually Royalda Mail API error or invalid email.
3. If no row: `intentEmail` was empty when webhook fired (user email not captured on `CheckoutIntent`).
   - Root cause: user completed checkout without passing through `/api/v1/checkout` GET (unlikely in normal flow).
   - Fix: resend receipt manually via Royalda Mail dashboard.
4. If `sentAt` set but `deliveredAt` null: check Royalda Mail dashboard for bounce/spam events.

### User's subscription shows as canceled when it shouldn't be

1. Check `PaymentEvent` for `isOverride` events (refund, chargeback, reversed) which force-cancel.
2. If incorrect: contact Dodo support to reverse the event. Manually restore subscription.

### Dunning: user was downgraded but paid

1. The grace period may have expired before Dodo fired `subscription.activated`.
2. Manually upsert `Subscription.plan` and `Subscription.status = 'active'`.
3. Clear `gracePeriodEndsAt`.

### Webhook signature failures (401 logs)

- Symptom: `webhook.sig_invalid` in logs
- Check: `DODO_WEBHOOK_SECRET` is set in Vercel production env
- Check: secret matches the one in Dodo dashboard → Developers → Webhooks
- Note: Dodo signs `webhook-id + "." + webhook-timestamp + "." + body` — our implementation is correct

---

## Environment Variables (Production)

| Variable | Source | Purpose |
|----------|--------|---------|
| `DODO_WEBHOOK_SECRET` | Dodo dashboard → Developers → Webhooks | Webhook signature verification |
| `DODO_PRODUCT_ID_LITE_MONTHLY` | Dodo dashboard → Products | Product ID lookup |
| `DODO_PRODUCT_ID_LITE_ANNUAL` | Dodo dashboard → Products | Product ID lookup |
| `DODO_PRODUCT_ID_PRO_MONTHLY` | Dodo dashboard → Products | Product ID lookup |
| `DODO_PRODUCT_ID_PRO_ANNUAL` | Dodo dashboard → Products | Product ID lookup |
| `DODO_PRODUCT_ID_FOUNDING` | Dodo dashboard → Products | Founding member product |
| `FOUNDING_MEMBER_ENABLED` | Manual | `"true"` to enable founding offer |
| `FOUNDING_MEMBER_MAX` | Manual | Max founding members (default 100) |
| `NEXT_PUBLIC_DODO_PAYMENT_KEY` | Dodo dashboard | Client-side checkout.js key |
| `ROYALDA_API_KEY` | Royalda Mail dashboard | Transactional email sending |
| `ROYALDA_WEBHOOK_SECRET` | Royalda Mail dashboard | Delivery webhook verification |

---

## Local Webhook Testing (ngrok)

```bash
# Terminal 1 — run the app
npm run dev

# Terminal 2 — expose locally
ngrok http 3000

# Copy the https URL, e.g. https://abc123.ngrok.io
# In Dodo dashboard → Developers → Webhooks:
#   URL: https://abc123.ngrok.io/api/v1/webhooks/dodo
#   Events: subscription.activated, subscription.renewed, subscription.canceled,
#            subscription.failed, subscription.payment_failed
# Copy the webhook secret and add to .env.local:
#   DODO_WEBHOOK_SECRET=whsec_...
```

---

## Key Database Queries

```sql
-- Check a user's subscription
SELECT * FROM "Subscription" WHERE "userId" = 'user_id_here';

-- Recent payment events for a user
SELECT * FROM "PaymentEvent" WHERE "userId" = 'user_id_here' ORDER BY "receivedAt" DESC LIMIT 10;

-- Quarantined events (unresolved userId)
SELECT * FROM "PaymentEvent" WHERE "quarantined" = true ORDER BY "receivedAt" DESC;

-- Email history for a user
SELECT * FROM "EmailLog" WHERE "userId" = 'user_id_here' ORDER BY "sentAt" DESC;

-- Founding member count
SELECT * FROM "FoundingCounter" WHERE id = 1;

-- Users in grace period
SELECT "userId", "email", "gracePeriodEndsAt" FROM "Subscription"
WHERE "status" = 'past_due' ORDER BY "gracePeriodEndsAt";
```

---

## Escalation

- **Dodo Payments support:** https://dodopayments.com — for payment disputes, refunds, webhook issues
- **Royalda Mail:** internal — check `mail.royalda.com` dashboard for delivery issues
- **Neon DB:** https://console.neon.tech — for database issues
