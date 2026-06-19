import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { validateImage } from '../lib/validateImage'
import CollectorTracker from './CollectorTracker'
import ConfirmModal from './ConfirmModal'
import sampleTrash from '../assets/sample_trash.jpg'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function nameOf(users, id, fallback = 'Unknown') {
  if (!id) return fallback
  return users.find((u) => u.id === id)?.name ?? fallback
}

const NODE_COLORS = { done: '#2f6b44', active: '#c97f1e', redo: '#b53419', todo: '#d8d6d2' }

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
            background: state === 'todo' ? '#fff' : color,
            border: `2px solid ${color}`,
            marginTop: 2,
          }}
        />
        {!last && <span className="flex-1" style={{ width: 2, background: '#e7e6e2', marginTop: 2 }} />}
      </div>
      <div className={`min-w-0 flex-1 ${last ? '' : 'pb-4'}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold" style={{ color: state === 'todo' ? '#a8a5a0' : '#1c1c1e' }}>
            {title}
          </p>
          {time && <span className="text-[10px]" style={{ color: '#c8c5c0' }}>{time}</span>}
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
          style={{ color: s <= value ? '#c97f1e' : '#dcdad6' }}
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
      <div className="overflow-hidden rounded-xl" style={{ border: '1.5px dashed #2f6b44', background: '#f6fdf8' }}>
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
            <span className="text-xs font-semibold" style={{ color: '#2f6b44' }}>Upload after-photo</span>
            <span className="text-[10px]" style={{ color: '#a8a5a0' }}>{hint}</span>
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => onPick(e.target.files[0])} />
          </label>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] font-medium" style={{ color: '#b53419' }}>{error}</p>}
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

export default function MessageThread({ request, currentUser, users, onClose, onUpdateStatus, onSubmitAfterPhoto, onPayment, onRate }) {
  const { id, status, photo, afterPhoto, price, gps, postedBy, collectedBy, rating, collectorRating } = request
  const myId = currentUser?.id
  const isOwner = postedBy === myId
  const isCollector = collectedBy === myId

  // --- Chat (lifted from ChatDrawer) ---
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!id) return
    let channel
    let cancelled = false
    supabase.from('messages').select('*').eq('request_id', id).order('sent_at').then(({ data }) => {
      if (cancelled) return
      setMessages(data ?? [])
      channel = supabase
        .channel(`messages:${id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${id}` }, (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]))
        })
        .subscribe()
    })
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 200) }, [])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !myId) return
    setText('')
    const { error } = await supabase.from('messages').insert({ request_id: id, sender_id: myId, text: trimmed })
    if (error) setText(trimmed)
  }

  // --- Collector location broadcast (lifted from CollectorView) ---
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

  // --- Confirmations ---
  const [pending, setPending] = useState(null) // 'collected' | 'pay' | 'reject'

  function runPending() {
    if (pending === 'collected') {
      onSubmitAfterPhoto(id, photoFile)
      onUpdateStatus(id, 'collected')
      setPhotoFile(null); setPhotoPreview(null)
    } else if (pending === 'pay') {
      onPayment(id, true)
    } else if (pending === 'reject') {
      onPayment(id, false)
    }
    setPending(null)
  }

  const counterpart = isOwner ? nameOf(users, collectedBy, 'Collector') : nameOf(users, postedBy, 'Poster')
  const collectorName = nameOf(users, collectedBy, 'The collector')

  // Node states
  const acceptedState = status === 'accepted' ? 'active' : 'done'
  const collectedState =
    status === 'paid' ? 'done'
    : status === 'collected' ? 'active'
    : status === 'disputed' ? 'redo'
    : 'todo'
  const paidState = status === 'paid' ? 'done' : 'todo'

  const confirmCopy = {
    collected: { title: 'Mark as collected?', message: 'Your after-photo will be sent to the poster to confirm payment.', label: 'Mark collected', color: '#2f6b44' },
    pay: { title: `Pay ₱${price}?`, message: 'Release payment to the collector for this pickup. This cannot be undone.', label: `Pay ₱${price}`, color: '#c97f1e' },
    reject: { title: 'Reject this proof?', message: 'The job returns to the collector to re-upload a new after-photo. No payment is sent.', label: 'Reject', color: '#b53419' },
  }
  const cc = pending ? confirmCopy[pending] : null

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col" style={{ background: '#f3f4f2' }}>
      {/* Header */}
      <div className="flex flex-shrink-0 items-center gap-3 bg-white px-3 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95" style={{ background: '#f3f4f2', color: '#706d67' }} aria-label="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <img src={photo || sampleTrash} alt="" className="h-10 w-10 flex-shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ color: '#1c1c1e' }}>{counterpart}</p>
          <p className="truncate text-xs" style={{ color: '#a8a5a0' }}>{gps} · <span style={{ color: '#c97f1e', fontWeight: 600 }}>₱{price}</span></p>
        </div>
      </div>

      {/* Journey rail (signature) — own scroll so actions stay reachable */}
      <div className="flex-shrink-0 overflow-y-auto bg-white px-4 pb-3 pt-4" style={{ maxHeight: '46vh', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <h2 className="mb-3 font-display text-[15px]" style={{ color: '#0d3320', fontWeight: 600 }}>Pickup journey</h2>

        <RailNode state={acceptedState} title="Accepted" >
          <p className="text-xs" style={{ color: '#706d67' }}>{collectorName} is on this pickup.</p>
          {status === 'accepted' && <div className="mt-2"><CollectorTracker request={request} /></div>}
        </RailNode>

        <RailNode state={collectedState} title={status === 'disputed' ? 'Needs a redo' : 'Collected'}>
          {/* collector uploads proof */}
          {status === 'accepted' && isCollector && (
            <>
              <AfterPhotoUpload preview={photoPreview} error={photoError} onPick={pickPhoto} hint="Required before marking collected" />
              <button
                onClick={() => photoFile && setPending('collected')}
                disabled={!photoFile}
                className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: photoFile ? '#2f6b44' : '#c8c5c0', cursor: photoFile ? 'pointer' : 'not-allowed' }}
              >
                Mark as collected
              </button>
            </>
          )}
          {status === 'accepted' && isOwner && (
            <p className="text-xs" style={{ color: '#a8a5a0' }}>Waiting for {collectorName} to upload a proof photo…</p>
          )}

          {/* disputed: collector re-uploads */}
          {status === 'disputed' && isCollector && (
            <>
              <p className="mb-2 text-xs font-medium" style={{ color: '#b53419' }}>The poster asked for a clearer photo. Upload a new one.</p>
              <AfterPhotoUpload preview={photoPreview} error={photoError} onPick={pickPhoto} hint="Re-submit your after-photo" />
              <button
                onClick={() => photoFile && setPending('collected')}
                disabled={!photoFile}
                className="mt-2 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-95"
                style={{ background: photoFile ? '#2f6b44' : '#c8c5c0', cursor: photoFile ? 'pointer' : 'not-allowed' }}
              >
                Re-submit photo
              </button>
            </>
          )}
          {status === 'disputed' && isOwner && (
            <p className="text-xs" style={{ color: '#a8a5a0' }}>You asked for a redo. Waiting for a new photo…</p>
          )}

          {/* collected / paid: show the before/after reveal */}
          {(status === 'collected' || status === 'paid') && (
            <>
              <BeforeAfter before={photo} after={afterPhoto} />
              {status === 'collected' && isOwner && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setPending('reject')} className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95" style={{ background: '#fce8e6', color: '#b53419' }}>
                    Reject
                  </button>
                  <button onClick={() => setPending('pay')} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all active:scale-95" style={{ background: '#c97f1e' }}>
                    Accept &amp; Pay ₱{price}
                  </button>
                </div>
              )}
              {status === 'collected' && isCollector && (
                <p className="mt-2 text-xs" style={{ color: '#a8a5a0' }}>Waiting for the poster to confirm payment…</p>
              )}
            </>
          )}
        </RailNode>

        <RailNode state={paidState} title="Paid" last>
          {status === 'paid' ? (
            <div className="space-y-2.5">
              {/* poster -> collector */}
              <div>
                <p className="text-[11px] font-medium" style={{ color: '#a8a5a0' }}>Poster → Collector</p>
                {rating != null
                  ? <Stars value={rating} readOnly />
                  : isOwner
                    ? <Stars value={0} onRate={(s) => onRate(id, s, 'poster')} />
                    : <p className="text-xs" style={{ color: '#c8c5c0' }}>Not rated yet</p>}
              </div>
              {/* collector -> poster */}
              <div>
                <p className="text-[11px] font-medium" style={{ color: '#a8a5a0' }}>Collector → Poster</p>
                {collectorRating != null
                  ? <Stars value={collectorRating} readOnly />
                  : isCollector
                    ? <Stars value={0} onRate={(s) => onRate(id, s, 'collector')} />
                    : <p className="text-xs" style={{ color: '#c8c5c0' }}>Not rated yet</p>}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#a8a5a0' }}>Payment and ratings unlock once the pickup is confirmed.</p>
          )}
        </RailNode>
      </div>

      {/* Chat */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="pt-6 text-center text-sm" style={{ color: '#c8c5c0' }}>No messages yet. Say hello!</p>
        )}
        {messages.map((m) => {
          const own = m.sender_id === myId
          return (
            <div key={m.id} className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}>
              <p className="mb-0.5 text-[10px] font-medium" style={{ color: '#a8a5a0' }}>
                {own ? 'You' : nameOf(users, m.sender_id)} · {formatTime(m.sent_at)}
              </p>
              <div
                className="max-w-[75%] px-3 py-2 text-sm"
                style={{
                  background: own ? '#0d3320' : '#fff',
                  color: own ? '#fff' : '#2d2b27',
                  borderRadius: own ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
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
      <div className="flex flex-shrink-0 items-center gap-2 px-4 py-3" style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <input
          ref={inputRef}
          className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none"
          style={{ background: '#f3f4f2', color: '#2d2b27' }}
          placeholder="Type a message…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all active:scale-95"
          style={{ background: text.trim() ? '#0d3320' : '#e8e6e1', color: text.trim() ? '#fff' : '#a8a5a0' }}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4 20-7z" /></svg>
        </button>
      </div>

      <ConfirmModal
        open={!!pending}
        title={cc?.title}
        message={cc?.message}
        confirmLabel={cc?.label}
        confirmColor={cc?.color}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
