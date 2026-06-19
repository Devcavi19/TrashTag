const TYPE_CONFIG = {
  event: { label: 'Event', color: '#2f6b44', bg: '#eaf5ec', strip: '#2f6b44' },
  news:  { label: 'News',  color: '#1966b5', bg: '#e8f0fe', strip: '#1966b5' },
  post:  { label: 'Post',  color: '#c97f1e', bg: '#fef3e0', strip: '#c97f1e' },
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatEventDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PostCard({ post, currentUserId, onLike }) {
  const { id, authorName, type, title, body, photoUrl, eventDate, eventLocation, externalUrl, createdAt, likes = [] } = post
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.post
  const initials = (authorName || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const liked = likes.includes(currentUserId)

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Signature: type color strip */}
      <div style={{ height: 5, background: cfg.strip }} />

      <div className="px-4 pt-3.5">
        {/* Author row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: '#0d3320', color: 'white' }}
            >
              {initials}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-bold" style={{ color: '#1c1c1e' }}>{authorName}</p>
              <p className="text-[11px]" style={{ color: '#c8c5c0' }}>{timeAgo(createdAt)}</p>
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>

        {/* Title */}
        {title && (
          <h3 className="text-[16px] font-bold leading-snug mb-1.5" style={{ color: '#1c1c1e' }}>
            {title}
          </h3>
        )}

        {/* Event details */}
        {type === 'event' && (eventDate || eventLocation) && (
          <div
            className="rounded-xl px-3 py-2.5 mb-2.5 space-y-1"
            style={{ background: cfg.bg }}
          >
            {eventDate && (
              <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: cfg.color }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {formatEventDate(eventDate)}
              </div>
            )}
            {eventLocation && (
              <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: cfg.color }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {eventLocation}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        {body && (
          <p className="text-[14px] leading-relaxed whitespace-pre-line mb-3" style={{ color: '#3a3a3c' }}>
            {body}
          </p>
        )}
      </div>

      {/* Photo */}
      {photoUrl && (
        <img src={photoUrl} alt={title || 'post'} className="w-full object-cover" style={{ maxHeight: 240 }} />
      )}

      <div className="px-4 py-3 flex items-center gap-4">
        {/* Like button */}
        <button
          onClick={() => onLike(id, currentUserId)}
          className="flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-95"
          style={{ color: liked ? '#c0392b' : '#a8a5a0' }}
          aria-pressed={liked}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likes.length}</span>
        </button>

        {/* External link */}
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-semibold transition-all active:scale-95"
            style={{ color: '#1966b5' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Read more
          </a>
        )}
      </div>
    </div>
  )
}
