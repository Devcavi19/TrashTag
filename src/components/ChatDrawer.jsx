import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const TYPE_COLORS = {
  Biodegradable: '#22863a',
  Recyclable: '#1966b5',
  Residual: '#b53419',
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatDrawer({ open, onClose, request, currentUser, users }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [loadTrigger, setLoadTrigger] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open || !request?.id) return

    let channel
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('request_id', request.id)
        .order('sent_at')

      if (cancelled) return
      if (err) {
        setError('Failed to load messages. Check your connection.')
        setLoading(false)
        return
      }
      setMessages(data ?? [])
      setLoading(false)

      channel = supabase
        .channel(`messages:${request.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${request.id}` },
          (payload) => {
            setMessages(prev =>
              prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]
            )
          }
        )
        .subscribe()
    }

    load()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
      setMessages([])
      setText('')
      setError(null)
      setLoading(false)
    }
  }, [open, request?.id, loadTrigger])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !currentUser?.id || !request?.id) return
    setText('')
    const { error: err } = await supabase.from('messages').insert({
      request_id: request.id,
      sender_id: currentUser.id,
      text: trimmed,
    })
    if (err) {
      setError('Failed to send. Try again.')
      setText(trimmed)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function getSenderName(senderId) {
    if (senderId === currentUser?.id) return 'You'
    return users?.find(u => u.id === senderId)?.name ?? 'Unknown'
  }

  if (!open || !request) return null

  const typeColor = TYPE_COLORS[request.type] || '#706d67'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex flex-col rounded-t-2xl overflow-hidden"
        style={{ width: '100%', maxWidth: 430, height: '80vh', background: '#f3f4f2' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 pt-4 pb-3 bg-white flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
        >
          <div style={{ width: 4, alignSelf: 'stretch', background: typeColor, borderRadius: 2, flexShrink: 0 }} />
          {request.photo && (
            <img
              src={request.photo}
              alt="trash"
              className="rounded-lg object-cover flex-shrink-0"
              style={{ width: 44, height: 44 }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#706d67' }}>
              {request.gps ?? 'Chat'}
            </p>
            <p className="text-sm font-bold" style={{ color: '#c97f1e' }}>₱{request.price}</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full transition-all active:scale-95 flex-shrink-0"
            style={{ width: 32, height: 32, background: '#f3f4f2', color: '#706d67' }}
            aria-label="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading && (
            <p className="text-center text-sm pt-6" style={{ color: '#a8a5a0' }}>Loading messages…</p>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-2 py-8">
              <p className="text-sm text-center" style={{ color: '#b53419' }}>{error}</p>
              <button
                onClick={() => setLoadTrigger(t => t + 1)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                style={{ background: '#0d3320', color: '#fff' }}
              >
                Retry
              </button>
            </div>
          )}
          {!loading && !error && messages.length === 0 && (
            <p className="text-center text-sm pt-8" style={{ color: '#c8c5c0' }}>
              No messages yet. Say hello!
            </p>
          )}
          {messages.map(msg => {
            const isOwn = msg.sender_id === currentUser?.id
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <p className="text-[10px] font-medium mb-0.5" style={{ color: '#a8a5a0' }}>
                  {getSenderName(msg.sender_id)} · {formatTime(msg.sent_at)}
                </p>
                <div
                  className="max-w-[75%] px-3 py-2 text-sm"
                  style={{
                    background: isOwn ? '#0d3320' : '#fff',
                    color: isOwn ? '#fff' : '#2d2b27',
                    borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          <input
            ref={inputRef}
            className="flex-1 text-sm rounded-xl px-3 py-2.5 outline-none"
            style={{ background: '#f3f4f2', color: '#2d2b27' }}
            placeholder="Type a message…"
            value={text}
            maxLength={500}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="flex items-center justify-center rounded-xl transition-all active:scale-95 flex-shrink-0"
            style={{
              width: 40,
              height: 40,
              background: text.trim() ? '#0d3320' : '#e8e6e1',
              color: text.trim() ? '#fff' : '#a8a5a0',
            }}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
