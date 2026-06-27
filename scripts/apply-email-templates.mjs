// Applies the branded TrashTag email templates (email-templates/*.html) to the
// Supabase project via the Management API.
//
// NOTE: Supabase rejects template customization on the free tier while using the
// default email provider. Configure custom SMTP first
// (Dashboard > Project Settings > Authentication > SMTP Settings), then run this.
//
// Usage:
//   export SUPABASE_ACCESS_TOKEN=sbp_...   # personal access token
//   node scripts/apply-email-templates.mjs
import { readFileSync } from 'node:fs'

const REF = 'qdezkdtlfkbdfpnvxxro'
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN
if (!TOKEN) { console.error('Set SUPABASE_ACCESS_TOKEN (personal access token).'); process.exit(1) }

const BASE = `https://api.supabase.com/v1/projects/${REF}/config/auth`
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
const read = (f) => readFileSync(new URL(`../email-templates/${f}`, import.meta.url), 'utf8')

const body = {
  mailer_subjects_confirmation: 'Confirm your TrashTag account',
  mailer_templates_confirmation_content: read('confirmation.html'),
  mailer_subjects_recovery: 'Reset your TrashTag password',
  mailer_templates_recovery_content: read('recovery.html'),
}

const res = await fetch(BASE, { method: 'PATCH', headers: H, body: JSON.stringify(body) })
if (!res.ok) { console.error('FAILED', res.status, await res.text()); process.exit(1) }
console.log('Email templates applied (confirmation + recovery).')
