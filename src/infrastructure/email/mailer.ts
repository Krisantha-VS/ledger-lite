const ROYALDA_MAIL_URL = 'https://mail.royalda.com/api/v1/send'
const ROYALDA_MAIL_KEY = process.env.ROYALDA_MAIL_API_KEY!
const FROM = 'noreply@royalda.com'

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch(ROYALDA_MAIL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ROYALDA_MAIL_KEY}` },
    body: JSON.stringify({ to, subject, html, from: FROM }),
  })
  if (!res.ok) throw new Error(`Mail error: ${res.status}`)
}
