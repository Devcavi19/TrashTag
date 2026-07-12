import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { validateImage } from '../lib/validateImage'

// Leaflet is heavy; only load the tracker (and the map with it) when a thread
// actually shows live tracking.
const CollectorTracker = lazy(() => import('./CollectorTracker'))
import ConfirmModal from './ConfirmModal'
import CollectorCredential from './CollectorCredential'
import StatusBadge from './StatusBadge'
import Button from './ui/Button'
import { PaySheet, ConfirmPaymentSheet } from './PaymentSheet'
import { METHOD_LABELS } from '../lib/paymentMethods'
import sampleTrash from '../assets/sample_trash.jpg'

const ACTIVE_STATUSES = ['accepted', 'collected', 'disputed', 'payment_sent']

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function nameOf(users, id, fallback = 'Unknown') {
  if (!id) return fallback
  return users.find((u) => u.id === id)?.name ?? fallback
}

const NODE_COLORS = {
  done: 'var(--success)',
  active: 'var(--accent)',
  redo: 'var(--danger)',
  todo: 'var(--border)',
}

function RailNode({ state, last, title, time, children }) {
  const color = NODE_COLORS[state]
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center" style={{ width: 16 }}>
        <span
          className="flex-shrink-0 rounded-full"
          style={{
            width: 14,
            height: 14,
            background: state === 'todo' ? 'var(--surface-card)' : color,
            border: `2px solid ${color}`,
            marginTop: 2,
          }}
        />
        {!last && <span className="flex-1" style={{ width: 2, background: 'var(--border)', marginTop: 2 }} />}
      </div>
      <div className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold" style={{ color: state === 'todo' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {title}
          </p>
          {time && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{time}</span>}
        </div>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}

function Stars({ value, onRate, readOnly }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          disabled={readOnly}
          onClick={() => !readOnly && onRate(s)}
          className={`text-xl leading-none transition-colors ${readOnly ? 'cursor-default' : 'active:scale-90'}`}
          style={{ color: s <= value ? 'var(--accent)' : 'var(--border)' }}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

function AfterPhotoUpload({ preview, error, onPick, hint }) {
  return (
    <>
      <div
        className="overflow-hidden rounded-xl"
        style={{
          border: '1.5px dashed var(--success)',
          background: 'color-mix(in srgb, var(--success) 8%, transparent)',
        }}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="after" className="w-full object-cover" style={{ maxHeight: 150 }} />
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
              Change
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => onPick(e.target.files[0])} />
            </label>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1 py-5">
            <span className="text-2xl" style={{ opacity: 0.4 }}>📷</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Upload after-photo</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{hint}</span>
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => onPick(e.target.files[0])} />
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--danger)' }}>{error}</p>}
    </>
  )
}

function BeforeAfter({ before, after }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {[{ src: before || sampleTrash, label: 'Before' }, { src: after, label: 'After' }].map((p) => (
        <div key={p.label} className="relative overflow-hidden rounded-lg">
          <img src={p.src} alt={p.label} className="w-full object-cover" style={{ height: 110 }} />
          <span className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>
            {p.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// One pickup collection inside a person's thread. Active pickups render open and
// highlighted; a completed (paid) pickup collapses to a summary line the user
// can expand to review its history.
function PickupCard({ request, currentUser, users, onUpdateStatus, onSubmitAfterPhoto, onRejectProof, onMarkPaymentSent, onConfirmPaymentReceived, onPaymentNotReceived, onRate, defaultExpanded }) {
  const { id, status, photo, afterPhoto, price, gps, postedBy, collectedBy, rating, collectorRating, paymentMethod, paymentReference, paymentSentAt, paymentConfirmedAt, postedAt } = request
  const myId = currentUser?.id
  const isOwner = postedBy === myId
  const isCollector = collectedBy === myId
  const isActive = ACTIVE_STATUSES.includes(status)

  const [expanded, setExpanded] = useState(defaultExpanded)

  // --- After-photo staging ---
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState(null)

  function pickPhoto(file) {
    if (!file) return
    const err = validateImage(file)
    if (err) { setPhotoError(err); return }
    setPhotoError(null)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  // --- Confirmations & payment sheets ---
  const [pending, setPending] = useState(null) // 'collected' | 'reject'
  const [paySheetOpen, setPaySheetOpen] = useState(false)
  const [confirmPayOpen, setConfirmPayOpen] = useState(false)

  function runPending() {
    if (pending === 'collected') {
      onSubmitAfterPhoto(id, photoFile)
      onUpdateStatus(id, 'collected')
      setPhotoFile(null); setPhotoPreview(null)
    } else if (pending === 'reject') {
      onRejectProof(id)
    }
    setPending(null)
  }

  // --- Collector location broadcast (only while actively en route) ---
  useEffect(() => {
    if (!isCollector || status !== 'accepted' || !myId || !navigator.geolocation) return
    function broadcast() {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await supabase.from('collector_locations').upsert(
          { collector_id: myId, request_id: id, lat: pos.coords.latitude, lng: pos.coords.longitude, updated_at: new Date().toISOString() },
          { onConflict: 'collector_id' }
        )
      })
    }
    broadcast()
    const interval = setInterval(broadcast, 5000)
    return () => clearInterval(interval)
  }, [isCollector, status, myId, id])

  const collectorName = nameOf(users, collectedBy, 'Your Green Collector')
  const counterpart = isOwner ? nameOf(users, collectedBy, 'Green Collector') : nameOf(users, postedBy, 'Poster')

  // Node states
  const acceptedState = status === 'accepted' ? 'active' : 'done'
  const collectedState =
    status === 'paid' || status === 'payment_sent' ? 'done'
    : status === 'collected' ? 'active'
    : status === 'disputed' ? 'redo'
    : 'todo'
  const paymentState =
    status === 'paid' ? 'done'
    : status === 'payment_sent' ? 'active'
    : 'todo'
  const paidState = status === 'paid' ? 'done' : 'todo'

  const confirmCopy = {
    collected: { title: 'Mark as collected?', message: 'Your after-photo will be sent to the poster to confirm payment.', label: 'Mark collected', color: 'var(--success)' },
    reject: { title: 'Reject this proof?', message: 'The job returns to your Green Collector to re-upload a new after-photo. No payment is sent.', label: 'Reject', color: 'var(--danger)' },
  }
  const cc = pending ? confirmCopy[pending] : null

  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{
        border: isActive ? '1.5px solid color-mix(in srgb, var(--brand) 55%, var(--border))' : '1px solid var(--border)',
        background: isActive ? 'color-mix(in srgb, var(--brand) 6%, var(--surface-card))' : 'var(--surface-card)',
      }}
    >
      {/* Summary bar — always visible; toggles the journey below */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="tt-press flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <img src={photo || sampleTrash} alt="" className="h-9 w-9 flex-shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>{gps}</p>
          <p className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {isOwner ? 'You posted' : 'You collect'} · <span style={{ color: 'var(--accent)', fontWeight: 600 }}>₱{price}</span>
            {postedAt && <> · {formatDay(postedAt)}</>}
          </p>
        </div>
        <StatusBadge variant={status} />
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <RailNode state={acceptedState} title="Accepted">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{collectorName} is on this pickup.</p>
            {status === 'accepted' && (
              <div className="mt-2">
                <Suspense fallback={<div className="tt-skeleton h-24 w-full" />}>
                  <CollectorTracker request={request} />
                </Suspense>
              </div>
            )}
          </RailNode>

          <RailNode state={collectedState} title={status === 'disputed' ? 'Needs a redo' : 'Collected'}>
            {status === 'accepted' && isCollector && (
              <>
                <AfterPhotoUpload preview={photoPreview} error={photoError} onPick={pickPhoto} hint="Required before marking collected" />
                <Button
                  full
                  className="mt-2"
                  disabled={!photoFile}
                  onClick={() => photoFile && setPending('collected')}
                  style={{ background: 'var(--success)', color: '#ffffff' }}
                >
                  Mark as collected
                </Button>
              </>
            )}
            {status === 'accepted' && isOwner && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for {collectorName} to upload a proof photo…</p>
            )}

            {status === 'disputed' && isCollector && (
              <>
                <p className="mb-2 text-xs font-medium" style={{ color: 'var(--danger)' }}>The poster asked for a clearer photo. Upload a new one.</p>
                <AfterPhotoUpload preview={photoPreview} error={photoError} onPick={pickPhoto} hint="Re-submit your after-photo" />
                <Button
                  full
                  className="mt-2"
                  disabled={!photoFile}
                  onClick={() => photoFile && setPending('collected')}
                  style={{ background: 'var(--success)', color: '#ffffff' }}
                >
                  Re-submit photo
                </Button>
              </>
            )}
            {status === 'disputed' && isOwner && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You asked for a redo. Waiting for a new photo…</p>
            )}

            {(status === 'collected' || status === 'payment_sent' || status === 'paid') && (
              <>
                <BeforeAfter before={photo} after={afterPhoto} />
                {status === 'collected' && isOwner && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      full
                      onClick={() => setPending('reject')}
                      style={{
                        background: 'color-mix(in srgb, var(--danger) 14%, transparent)',
                        color: 'var(--danger)',
                      }}
                    >
                      Reject
                    </Button>
                    <Button full onClick={() => setPaySheetOpen(true)}>
                      Accept &amp; pay ₱{price}
                    </Button>
                  </div>
                )}
                {status === 'collected' && isCollector && (
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for the poster to review the proof and send payment…</p>
                )}
              </>
            )}
          </RailNode>

          <RailNode state={paymentState} title="Payment">
            {status === 'payment_sent' ? (
              isCollector ? (
                <>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {counterpart} reports sending ₱{price} via {METHOD_LABELS[paymentMethod] ?? '—'}.
                  </p>
                  <Button full className="mt-2" onClick={() => setConfirmPayOpen(true)}>
                    Review payment ₱{price}
                  </Button>
                </>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  You sent ₱{price} via {METHOD_LABELS[paymentMethod] ?? '—'}
                  {paymentReference && <> · Ref {paymentReference}</>}. Waiting for {collectorName} to
                  confirm receipt…
                </p>
              )
            ) : status === 'paid' ? (
              <div
                className="rounded-xl px-3 py-2.5 text-[11.5px]"
                style={{ background: 'color-mix(in srgb, var(--success) 8%, transparent)', color: 'var(--text-secondary)' }}
              >
                <div className="flex justify-between">
                  <span>₱{price} · {METHOD_LABELS[paymentMethod] ?? 'Payment'}{paymentReference && <> · Ref {paymentReference}</>}</span>
                </div>
                {paymentSentAt && (
                  <div className="mt-0.5 flex justify-between">
                    <span>Sent</span>
                    <b style={{ color: 'var(--success)' }}>{formatTime(paymentSentAt)} ✓</b>
                  </div>
                )}
                {paymentConfirmedAt && (
                  <div className="mt-0.5 flex justify-between">
                    <span>Received</span>
                    <b style={{ color: 'var(--success)' }}>{formatTime(paymentConfirmedAt)} ✓</b>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {isOwner
                  ? 'Payment starts once you accept the proof photo.'
                  : 'Payment starts once the poster accepts your proof photo.'}
              </p>
            )}
          </RailNode>

          <RailNode state={paidState} title="Paid" last>
            {status === 'paid' ? (
              <div className="space-y-2.5">
                <div>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Poster → Green Collector</p>
                  {rating != null
                    ? <Stars value={rating} readOnly />
                    : isOwner
                      ? <Stars value={0} onRate={(s) => onRate(id, s, 'poster')} />
                      : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not rated yet</p>}
                </div>
                <div>
                  <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Green Collector → Poster</p>
                  {collectorRating != null
                    ? <Stars value={collectorRating} readOnly />
                    : isCollector
                      ? <Stars value={0} onRate={(s) => onRate(id, s, 'collector')} />
                      : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Not rated yet</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Payment and ratings unlock once the pickup is confirmed.</p>
            )}
          </RailNode>
        </div>
      )}

      <ConfirmModal
        open={!!pending}
        title={cc?.title}
        message={cc?.message}
        confirmLabel={cc?.label}
        confirmColor={cc?.color}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />

      <PaySheet
        open={paySheetOpen}
        onClose={() => setPaySheetOpen(false)}
        request={request}
        collectorProfile={users.find((u) => u.id === collectedBy)}
        onMarkSent={(method, reference) => onMarkPaymentSent(id, method, reference)}
      />

      <ConfirmPaymentSheet
        open={confirmPayOpen}
        onClose={() => setConfirmPayOpen(false)}
        request={request}
        posterName={nameOf(users, postedBy, 'The poster')}
        onConfirm={() => onConfirmPaymentReceived(id)}
        onNotReceived={() => onPaymentNotReceived(id)}
      />
    </div>
  )
}

export default function MessageThread({ requests, counterpartId, currentUser, users, onClose, onUpdateStatus, onSubmitAfterPhoto, onRejectProof, onMarkPaymentSent, onConfirmPaymentReceived, onPaymentNotReceived, onRate, credentialFor }) {
  const myId = currentUser?.id

  // The pickup new chat messages attach to: the newest still-in-motion one, or
  // failing that the most recent pickup with this person.
  const activeReq = requests.find((r) => r.status !== 'paid') ?? requests[0]
  const activeCount = requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).length

  // --- Unified chat across every pickup shared with this person ---
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Keep the live set of request ids the subscription should accept.
  const idsKey = requests.map((r) => r.id).join(',')
  const idSetRef = useRef(new Set())
  useEffect(() => {
    idSetRef.current = new Set(idsKey ? idsKey.split(',') : [])
  }, [idsKey])

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (ids.length === 0) return
    let channel
    let cancelled = false
    supabase.from('messages').select('*').in('request_id', ids).order('sent_at').then(({ data }) => {
      if (cancelled) return
      setMessages(data ?? [])
      // RLS already limits realtime to rows I'm party to; we still match on the
      // current id set so only this person's pickups land in this thread.
      channel = supabase
        .channel(`messages:peer:${counterpartId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          if (!idSetRef.current.has(payload.new.request_id)) return
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]))
        })
        .subscribe()
    })
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [idsKey, counterpartId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !myId || !activeReq) return
    setText('')
    const { error } = await supabase.from('messages').insert({ request_id: activeReq.id, sender_id: myId, text: trimmed })
    if (error) setText(trimmed)
  }

  const counterpartName = nameOf(users, counterpartId, 'Green Collector')
  // Show the credential trust line when this person is my Green Collector.
  const iAmPoster = requests.some((r) => r.postedBy === myId && r.collectedBy === counterpartId)
  const cred = iAmPoster ? credentialFor?.(counterpartId) : null

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col" style={{ background: 'var(--surface)' }}>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 px-3 py-3" style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={onClose}
          className="tt-press flex h-8 w-8 items-center justify-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)', color: 'var(--text-secondary)' }}
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="min-w-0 flex-1">
          {cred ? (
            <CollectorCredential {...cred} />
          ) : (
            <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{counterpartName}</p>
          )}
          <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
            {requests.length} pickup{requests.length === 1 ? '' : 's'}
            {activeCount > 0 && <> · <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{activeCount} active</span></>}
          </p>
        </div>
      </div>

      {/* Pickup collections — own scroll so the chat stays reachable */}
      <div className="flex-shrink-0 space-y-2 overflow-y-auto px-3 py-3" style={{ maxHeight: '48vh', background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
        {requests.map((r) => (
          <PickupCard
            key={r.id}
            request={r}
            currentUser={currentUser}
            users={users}
            onUpdateStatus={onUpdateStatus}
            onSubmitAfterPhoto={onSubmitAfterPhoto}
            onRejectProof={onRejectProof}
            onMarkPaymentSent={onMarkPaymentSent}
            onConfirmPaymentReceived={onConfirmPaymentReceived}
            onPaymentNotReceived={onPaymentNotReceived}
            onRate={onRate}
            defaultExpanded={r.status !== 'paid'}
          />
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="pt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const own = m.sender_id === myId
          return (
            <div key={m.id} className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}>
              <p className="mb-0.5 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {own ? 'You' : nameOf(users, m.sender_id)} · {formatTime(m.sent_at)}
              </p>
              <div
                className="max-w-[75%] px-3 py-2 text-sm"
                style={{
                  background: own ? 'var(--brand)' : 'var(--surface-card)',
                  color: own ? 'var(--on-brand)' : 'var(--text-primary)',
                  border: own ? 'none' : '1px solid var(--border)',
                  borderRadius: own ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: 'var(--shadow-card)',
                  wordBreak: 'break-word',
                }}
              >
                {m.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3" style={{ background: 'var(--surface-raised)', borderTop: '1px solid var(--border)' }}>
        <input
          ref={inputRef}
          className="tt-input flex-1 px-3 py-2.5 text-sm"
          placeholder="Type a message…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="tt-press flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
          style={{
            background: text.trim() ? 'var(--brand)' : 'color-mix(in srgb, var(--text-primary) 8%, transparent)',
            color: text.trim() ? 'var(--on-brand)' : 'var(--text-muted)',
          }}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </div>
    </div>
  )
}
