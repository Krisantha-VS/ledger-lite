import { sendMail } from './mailer'

// ── Shared layout ─────────────────────────────────────────────────────────────

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LedgerLite</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#7c3aed;padding:24px 32px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                LedgerLite
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px 24px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                This is an automated notification from LedgerLite.<br />
                You are receiving this because you have email alerts enabled.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function badge(text: string, bg: string, color = '#ffffff'): string {
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;">${text}</span>`
}

function stat(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#6b7280;">${label}</td>
      <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">${value}</td>
    </tr>`
}

// ── 1. Budget exceeded ─────────────────────────────────────────────────────────

interface BudgetExceededParams {
  categoryName: string
  spent: number
  budget: number
  currency: string
}

export function budgetExceededEmail({ categoryName, spent, budget, currency }: BudgetExceededParams): { subject: string; html: string } {
  const over    = spent - budget
  const pctOver = Math.round((over / budget) * 100)
  const fmt     = (n: number) => `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const subject = `⚠️ Budget alert: ${categoryName} exceeded`
  const html = wrap(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Budget Exceeded</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Your <strong>${categoryName}</strong> spending has gone over budget this month.</p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;color:#dc2626;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Over Budget by ${pctOver}%</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#dc2626;">${fmt(over)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${stat('Budget limit', fmt(budget))}
      ${stat('Amount spent', fmt(spent))}
      ${stat('Category', categoryName)}
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
      Consider reviewing your spending in this category to stay on track.
    </p>
  `)

  return { subject, html }
}

// ── 2. Recurring transaction processed ────────────────────────────────────────

interface RecurringTransactionParams {
  note: string
  amount: number
  currency: string
  accountName: string
  date: string
}

export function recurringTransactionEmail({ note, amount, currency, accountName, date }: RecurringTransactionParams): { subject: string; html: string } {
  const fmt = (n: number) => `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const subject = `Recurring transaction processed: ${note}`
  const html = wrap(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Recurring Transaction</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Your recurring payment has been automatically processed.</p>

    <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Amount Processed</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#7c3aed;">${fmt(amount)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${stat('Description', note)}
      ${stat('Account', accountName)}
      ${stat('Date', date)}
      ${stat('Status', '<span style="color:#16a34a;font-weight:600;">Processed</span>')}
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
      This transaction was auto-processed based on your recurring schedule.
    </p>
  `)

  return { subject, html }
}

// ── 3. Goal completed ──────────────────────────────────────────────────────────

interface GoalCompletedParams {
  goalName: string
  targetAmount: number
  currency: string
  completedDate: string
}

export function goalCompletedEmail({ goalName, targetAmount, currency, completedDate }: GoalCompletedParams): { subject: string; html: string } {
  const fmt = (n: number) => `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const subject = `🎉 Goal achieved: ${goalName}`
  const html = wrap(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Goal Achieved! 🎉</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">Congratulations! You've reached your savings goal.</p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Target Reached</p>
      <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#16a34a;">${fmt(targetAmount)}</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${goalName}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${stat('Goal name', goalName)}
      ${stat('Target amount', fmt(targetAmount))}
      ${stat('Completed on', completedDate)}
    </table>

    <p style="margin:20px 0 0;font-size:14px;color:#374151;">
      You've worked hard and it paid off. Time to set your next goal!
    </p>
  `)

  return { subject, html }
}

// ── 4. Large expense alert ─────────────────────────────────────────────────────

interface LargeExpenseParams {
  amount: number
  currency: string
  categoryName: string
  note?: string | null
}

export function largeExpenseEmail({ amount, currency, categoryName, note }: LargeExpenseParams): { subject: string; html: string } {
  const fmt = (n: number) => `${currency}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const subject = `Large expense alert: ${currency}${amount}`
  const html = wrap(`
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Large Expense Detected</p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;">An unusually large expense was recorded on your account.</p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 6px;font-size:13px;color:#ea580c;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Expense Amount</p>
      <p style="margin:0;font-size:28px;font-weight:700;color:#ea580c;">${fmt(amount)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${stat('Category', categoryName)}
      ${note ? stat('Note', note) : ''}
      ${stat('Amount', fmt(amount))}
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
      If this transaction looks unfamiliar, please review it in your LedgerLite account.
    </p>
  `)

  return { subject, html }
}

// ── Convenience re-exports ─────────────────────────────────────────────────────

export { sendMail }
