import nodemailer from 'nodemailer'
import pool from './db.js'

// Twilio is lazy-loaded only when an SMS is actually sent so the heavy
// SDK does NOT initialize (and spawn internal threads) on every server start.
let _twilioMod = null
async function getTwilio() {
  if (!_twilioMod) _twilioMod = (await import('twilio')).default
  return _twilioMod
}

// ── Target → role name mapping ────────────────────────────────────────────────
const TARGET_ROLE = {
  Admin:      'Admin',
  Responders: 'Responder',
  Officers:   'Officer',
  Students:   'Student',
}

async function getEmailsForTarget(target) {
  if (target === 'All') {
    const [rows] = await pool.execute(
      "SELECT email FROM User WHERE status = 'Active' AND email IS NOT NULL AND email != ''"
    )
    return rows.map(r => r.email)
  }
  const roleName = TARGET_ROLE[target]
  if (!roleName) return []
  const [rows] = await pool.execute(
    "SELECT u.email FROM User u INNER JOIN Role r ON u.roleId = r.id WHERE r.name = ? AND u.status = 'Active' AND u.email IS NOT NULL AND u.email != ''",
    [roleName]
  )
  return rows.map(r => r.email)
}

async function getPhonesForTarget(target) {
  if (target === 'All') {
    const [rows] = await pool.execute(
      "SELECT phone FROM User WHERE status = 'Active' AND phone IS NOT NULL AND phone != ''"
    )
    return rows.map(r => r.phone)
  }
  const roleName = TARGET_ROLE[target]
  if (!roleName) return []
  const [rows] = await pool.execute(
    "SELECT u.phone FROM User u INNER JOIN Role r ON u.roleId = r.id WHERE r.name = ? AND u.status = 'Active' AND u.phone IS NOT NULL AND u.phone != ''",
    [roleName]
  )
  return rows.map(r => r.phone)
}

// ── SMS via Twilio ────────────────────────────────────────────────────────────

export async function sendSmsToTarget(target, title, message) {
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from  = process.env.TWILIO_FROM

  if (!sid || !token || !from) {
    console.warn('[SMS] Twilio not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM missing) — skipping SMS delivery')
    return { sent: 0, total: 0, errors: ['Twilio not configured'] }
  }

  const phones = await getPhonesForTarget(target)
  if (!phones.length) {
    console.warn(`[SMS] No phone numbers found for target: ${target}`)
    return { sent: 0, total: 0, errors: [] }
  }

  const twilioFn = await getTwilio()
  const client = twilioFn(sid, token)
  const body   = `[UV SCARS] ${title}: ${message}`
  let sent = 0
  const errors = []

  for (const phone of phones) {
    try {
      await client.messages.create({ body, from, to: phone })
      sent++
    } catch (e) {
      errors.push(`${phone}: ${e.message}`)
      console.error(`[SMS] Failed for ${phone}:`, e.message)
    }
  }

  console.log(`[SMS] target=${target} sent=${sent}/${phones.length}`)
  return { sent, total: phones.length, errors }
}

// ── Email via SMTP (nodemailer) ───────────────────────────────────────────────

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendEmailToTarget(target, subject, body) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[Email] SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS missing) — skipping email delivery')
    return { sent: 0, total: 0, errors: ['SMTP not configured'] }
  }

  const emails = await getEmailsForTarget(target)
  if (!emails.length) {
    console.warn(`[Email] No email addresses found for target: ${target}`)
    return { sent: 0, total: 0, errors: [] }
  }

  const from = `"UV SCARS Alerts" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`
  const htmlBody = body.replace(/\n/g, '<br>')

  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from,
      bcc: emails,
      subject,
      text: body,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <div style="background:#2E7D32;padding:16px 24px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0;font-size:18px">UV SCARS Alert</h2>
            <p style="color:#c8e6c9;margin:4px 0 0;font-size:12px">University of the Visayas Toledo Campus</p>
          </div>
          <div style="border:1px solid #C8E6C9;border-top:none;padding:24px;border-radius:0 0 8px 8px">
            <h3 style="color:#1B5E20;margin-top:0">${subject}</h3>
            <p style="color:#333;line-height:1.6">${htmlBody}</p>
          </div>
          <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:16px">
            This is an automated alert from UV SCARS — Smart Campus Alert &amp; Response System.
          </p>
        </div>`,
    })
    console.log(`[Email] target=${target} sent=${emails.length}/${emails.length}`)
    return { sent: emails.length, total: emails.length, errors: [] }
  } catch (e) {
    console.error('[Email] Send failed:', e.message)
    return { sent: 0, total: emails.length, errors: [e.message] }
  }
}
