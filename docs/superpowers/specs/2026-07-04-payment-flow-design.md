# TrashTag — Payment Flow with Dual Confirmation (Phase 2)

**Date:** 2026-07-04
**Status:** Approved design (decisions made and user-approved during the
2026-07-04 brainstorm; recorded in the Phase 1 spec roadmap), implementing.

## What this is

Money moves **outside the app** (GCash / Maya / cash handed over directly).
The app records the handshake with ceremony: the poster reports sending
payment, the collector confirms receiving it, and both see a receipt. No
payment gateway, no fees, no KYC.

## Lifecycle change

`open → accepted → collected → payment_sent → paid` (plus the existing
`disputed` branch at the proof-review stage, unchanged).

- **`collected` → `payment_sent`** (poster): after accepting the proof photo,
  the poster gets the **pay sheet** — amount due, the collector's payment
  details, method picker (GCash / Maya / Cash), optional reference number,
  and "I've sent the payment".
- **`payment_sent` → `paid`** (collector): the collector sees what the poster
  reported (method, reference, time) and taps **Confirm received**.
- **Escape hatch** (collector): "Haven't received it?" reverts the request to
  `collected` and clears the payment fields so the poster can retry; the chat
  is right there for sorting it out.
- The old one-tap "Accept & Pay" is replaced by "Accept proof & pay…", which
  opens the pay sheet. **Reject → `disputed`** is untouched.

## Data model (migration `payment_flow`)

`requests` gains:

| column | type | notes |
| --- | --- | --- |
| `payment_method` | text, check `gcash|maya|cash` | null until payment starts |
| `payment_reference` | text | optional ref no. from the poster |
| `payment_sent_at` | timestamptz | set on "I've sent the payment" |
| `payment_confirmed_at` | timestamptz | set on "Confirm received" |

`requests_status_check` gains `payment_sent`.

`profiles` gains `gcash_number` and `maya_number` (nullable text) — the
collector's receiving details, edited in a new **Payment details** card in
ProfileView. Profiles are already world-readable (`profiles_select: true`),
which is what lets the poster see where to send; acceptable for this app's
neighborhood scale and called out here deliberately.

**No RLS changes needed:** `requests_update` already allows poster or
collector; `profiles_update` already allows self.

## Code changes

- **`useRequests.dbToApp`** maps the four new columns
  (`paymentMethod/paymentReference/paymentSentAt/paymentConfirmedAt`).
- **`App.jsx` mutators** (following the write-then-realtime-echo pattern):
  - `markPaymentSent(id, method, reference)` → `status='payment_sent'` +
    method/reference/`payment_sent_at`.
  - `confirmPaymentReceived(id)` → `status='paid'` + `payment_confirmed_at`.
  - `reportPaymentNotReceived(id)` → back to `'collected'`, payment fields
    nulled.
  - `handlePayment(id, accept)` loses its `accept=true` branch (reject →
    `disputed` stays).
- **`PaymentSheet.jsx`** (new, on the `Sheet` primitive): both faces of the
  handshake — poster's pay sheet and collector's confirm sheet.
- **`MessageThread`** journey rail gains a **Payment** node between Collected
  and Paid; the Paid node shows a receipt (method · reference · sent/confirmed
  times) above the existing ratings.
- **`StatusBadge`**: `payment_sent` → "Payment sent" (accent tint).
- **Active-conversation logic** (`App.jsx` badge count, `Conversations`):
  `payment_sent` counts as in-motion.
- **`ProfileView`**: "Payment details" card (GCash/Maya numbers, save writes
  to own profile row).

## Error handling

Supabase write failures surface exactly like existing mutators (the UI simply
doesn't advance; realtime never echoes). The pay sheet disables "I've sent the
payment" until a method is chosen. The escape hatch is the recovery path for
false/mistaken sends — no dead-end states: every status has an actor with an
available action.

## Verification

Live end-to-end with the two test accounts: post → accept → after-photo →
collected → poster pays via sheet (method + reference) → DB shows
`payment_sent` + fields → collector confirms → DB shows `paid` +
`payment_confirmed_at` → receipt + ratings render. Escape hatch exercised
once (`payment_sent` → `collected` with fields cleared). Both themes
screenshotted. `npm run lint` + `npm run build` green.
