# Implementation Plan — Payment Flow (Phase 2)

Spec: [2026-07-04-payment-flow-design.md](../specs/2026-07-04-payment-flow-design.md)

## Step 1 — Migration

- `supabase migration fetch` to materialize remote history locally, then add
  `payment_flow` migration: widen `requests_status_check` with
  `payment_sent`; add `requests.payment_method/-_reference/-_sent_at/
  -_confirmed_at`; add `profiles.gcash_number/maya_number`.
- Apply via `supabase db query --linked`; record with `supabase migration repair`.
- Verify: constraint + columns present; RLS untouched.

## Step 2 — Data layer

- `useRequests.dbToApp`: map the four payment columns.
- `App.jsx`: `markPaymentSent`, `confirmPaymentReceived`,
  `reportPaymentNotReceived`; `handlePayment` keeps only the reject branch;
  `payment_sent` joins the active-conversation status list (badge) and
  `Conversations.ACTIVE`.

## Step 3 — UI

- `StatusBadge`: `payment_sent` → "Payment sent" (accent tint).
- `PaymentSheet.jsx`: poster face (amount, collector's GCash/Maya numbers,
  method picker, optional reference, "I've sent the payment") and collector
  face (reported method/ref/time, "Confirm received", "Haven't received it?").
- `MessageThread`: Payment rail node between Collected and Paid; pay sheet
  wired to "Accept proof & pay…"; receipt block in the Paid node.
- `ProfileView`: Payment details card (GCash/Maya inputs + save).
- Preview-harness screens for the new sheets.

## Step 4 — Verification

- Lint + build green.
- Live E2E per spec (both accounts, escape hatch once, DB truth-checks, both
  themes).
