// Both faces of the dual-confirmation payment handshake. Money moves outside
// the app (GCash / Maya / cash handed over directly); these sheets record it.
import { useState } from 'react'
import Sheet from './ui/Sheet'
import Button from './ui/Button'
import { Input } from './ui/Input'
import { METHOD_LABELS } from '../lib/paymentMethods'

function formatWhen(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function AmountDue({ price }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        Amount due
      </p>
      <p className="font-display text-[34px] leading-tight" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        ₱{price}
      </p>
    </div>
  )
}

// Poster face: pick how you paid, optionally attach a reference, report it sent.
export function PaySheet({ open, onClose, request, collectorProfile, onMarkSent }) {
  const [method, setMethod] = useState(null)
  const [reference, setReference] = useState('')
  const [sending, setSending] = useState(false)

  const collectorName = collectorProfile?.name || 'the collector'
  const numbers = {
    gcash: collectorProfile?.gcash_number,
    maya: collectorProfile?.maya_number,
  }

  async function send() {
    if (!method || sending) return
    setSending(true)
    await onMarkSent(method, reference)
    setSending(false)
    onClose()
  }

  return (
    <Sheet open={open} title={`Pay ${collectorName}`} onClose={onClose}>
      <AmountDue price={request.price} />

      <p className="mb-2 text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
        How are you paying?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(METHOD_LABELS).map(([key, label]) => {
          const selected = method === key
          return (
            <button
              key={key}
              onClick={() => setMethod(key)}
              className="tt-press rounded-xl px-2 py-2.5 text-center"
              style={{
                border: selected ? '2px solid var(--brand)' : '2px solid var(--border)',
                background: selected ? 'color-mix(in srgb, var(--brand) 10%, transparent)' : 'transparent',
              }}
              aria-pressed={selected}
            >
              <span className="block text-[13px] font-bold" style={{ color: selected ? 'var(--brand)' : 'var(--text-primary)' }}>
                {label}
              </span>
              {key !== 'cash' && (
                <span className="mt-0.5 block truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {numbers[key] || 'no number saved'}
                </span>
              )}
              {key === 'cash' && (
                <span className="mt-0.5 block text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  hand it over
                </span>
              )}
            </button>
          )
        })}
      </div>

      {method && method !== 'cash' && !numbers[method] && (
        <p className="mt-2 text-[11px] font-medium" style={{ color: 'var(--warning)' }}>
          {collectorName} hasn't saved a {METHOD_LABELS[method]} number — ask for it in the chat.
        </p>
      )}

      <div className="mt-4">
        <Input
          label="Reference no. (optional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. 9021 3456 7890"
          maxLength={60}
        />
      </div>

      <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
        Send the money in your {method ? METHOD_LABELS[method] : 'payment'} app first, then report it
        here. {collectorName} confirms on their end to close the pickup.
      </p>

      <Button full className="mt-4" disabled={!method} loading={sending} onClick={send} style={{ paddingBlock: 12 }}>
        I've sent the payment
      </Button>
    </Sheet>
  )
}

// Collector face: see what the poster reported, confirm it landed — or flag it.
export function ConfirmPaymentSheet({ open, onClose, request, posterName, onConfirm, onNotReceived }) {
  const [working, setWorking] = useState(false)

  async function confirm() {
    if (working) return
    setWorking(true)
    await onConfirm()
    setWorking(false)
    onClose()
  }

  async function notReceived() {
    if (working) return
    setWorking(true)
    await onNotReceived()
    setWorking(false)
    onClose()
  }

  return (
    <Sheet open={open} title="Payment incoming" onClose={onClose}>
      <AmountDue price={request.price} />

      <div
        className="rounded-xl px-3.5 py-3 text-[13px]"
        style={{ background: 'color-mix(in srgb, var(--text-primary) 4%, transparent)', color: 'var(--text-secondary)' }}
      >
        <b style={{ color: 'var(--text-primary)' }}>{posterName}</b> says they sent it via{' '}
        <b style={{ color: 'var(--text-primary)' }}>{METHOD_LABELS[request.paymentMethod] ?? '—'}</b>
        {request.paymentReference && <> · Ref {request.paymentReference}</>}
        {request.paymentSentAt && <> · {formatWhen(request.paymentSentAt)}</>}
      </div>

      <p className="mt-3 text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
        Check your {METHOD_LABELS[request.paymentMethod] ?? 'payment'} account before confirming —
        confirming marks this pickup as paid.
      </p>

      <Button full className="mt-4" loading={working} onClick={confirm} style={{ paddingBlock: 12 }}>
        Confirm received ✓
      </Button>
      <button
        onClick={notReceived}
        disabled={working}
        className="tt-press mt-2 w-full py-2 text-center text-[13px] font-semibold"
        style={{ color: 'var(--danger)' }}
      >
        Haven't received it?
      </button>
      <p className="mt-1 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
        This sends the pickup back to "collected" so {posterName} can retry — use the chat to sort it out.
      </p>
    </Sheet>
  )
}
