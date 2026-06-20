// Community feed cards. The signature of this feed is that each post *type* is a
// different object, not the same card with a different stripe:
//   event → a tear-off invite with a calendar date block
//   news  → an editorial bulletin clipping (serif headline, source-forward)
//   post  → a neighbor's note (casual, avatar- and photo-forward)
// You can tell them apart mid-scroll without reading the badge.

const FOREST = '#0d3320'
const INK = '#1c1c1e'
const BODY = '#3a3a3c'
const FAINT = '#a8a5a0'
const LIKE_ON = '#c0392b'

const EVENT = { color: '#2f6b44', bg: '#eaf5ec' }
const NEWS = { color: '#1966b5', bg: '#e8f0fe' }
const POST = { color: '#c97f1e', bg: '#fef3e0' }

const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)'

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function eventParts(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate(),
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  }
}

function initialsOf(name) {
  return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

function PinIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function HeartButton({ liked, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-95"
      style={{ color: liked ? LIKE_ON : FAINT }}
      aria-pressed={liked}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{count}</span>
    </button>
  )
}

function ReadMore({ url, color }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[13px] font-semibold transition-all active:scale-95"
      style={{ color }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      Read more
    </a>
  )
}

// Shared bottom rail — keeps interactions consistent across all three archetypes.
function Footer({ post, liked, onLike, currentUserId, linkColor }) {
  const { id, externalUrl, likes = [] } = post
  return (
    <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: '1px solid #f1f0ec' }}>
      <HeartButton liked={liked} count={likes.length} onClick={() => onLike(id, currentUserId)} />
      {externalUrl && <ReadMore url={externalUrl} color={linkColor} />}
    </div>
  )
}

// ── EVENT ─────────────────────────────────────────────────────────────────
// A tear-off invite. The bold calendar block on the left changes the card's
// silhouette so an event is unmistakable in the feed.
function EventCard({ post, liked, onLike, currentUserId }) {
  const { authorName, title, body, photoUrl, eventDate, eventLocation, createdAt } = post
  const parts = eventDate ? eventParts(eventDate) : null

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex">
        {/* Date block — the hero */}
        <div
          className="flex flex-col items-center justify-center flex-shrink-0 px-3 py-4"
          style={{
            width: 72,
            background: EVENT.color,
            color: '#fff',
            borderRight: '2px dashed rgba(255,255,255,0.45)',
          }}
        >
          {parts ? (
            <>
              <span className="text-[10px] font-bold tracking-widest" style={{ opacity: 0.8 }}>{parts.weekday}</span>
              <span className="font-display leading-none" style={{ fontSize: 30, fontWeight: 600 }}>{parts.day}</span>
              <span className="text-[10px] font-bold tracking-widest" style={{ opacity: 0.8 }}>{parts.month}</span>
            </>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 px-3.5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: EVENT.color }}>
            Community event
          </span>
          {title && (
            <h3 className="font-display text-[17px] leading-snug mt-0.5" style={{ color: INK, fontWeight: 600 }}>
              {title}
            </h3>
          )}
          {eventLocation && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[12px] font-semibold" style={{ color: EVENT.color }}>
              <PinIcon />
              <span className="truncate">{eventLocation}</span>
            </div>
          )}
          {body && (
            <p className="text-[13px] leading-relaxed mt-1.5" style={{ color: BODY, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {body}
            </p>
          )}
          <p className="text-[11px] mt-2" style={{ color: FAINT }}>
            Hosted by {authorName} · {timeAgo(createdAt)}
          </p>
        </div>
      </div>

      {photoUrl && <img src={photoUrl} alt={title || 'event'} className="w-full object-cover" style={{ maxHeight: 200 }} />}
      <Footer post={post} liked={liked} onLike={onLike} currentUserId={currentUserId} linkColor={EVENT.color} />
    </div>
  )
}

// ── NEWS ──────────────────────────────────────────────────────────────────
// An editorial bulletin: serif headline, blue kicker, source-forward. Reads
// like a clipping rather than a social post.
function NewsCard({ post, liked, onLike, currentUserId }) {
  const { authorName, title, body, photoUrl, createdAt } = post

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: CARD_SHADOW, borderLeft: `3px solid ${NEWS.color}` }}>
      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full" style={{ background: NEWS.color }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: NEWS.color }}>
            Bulletin
          </span>
        </div>

        {title && (
          <h3 className="font-display text-[19px] leading-tight mt-1.5" style={{ color: INK, fontWeight: 600 }}>
            {title}
          </h3>
        )}

        <p className="text-[11px] font-medium mt-1.5" style={{ color: FAINT }}>
          Reported by {authorName} · {timeAgo(createdAt)}
        </p>
      </div>

      {photoUrl && <img src={photoUrl} alt={title || 'news'} className="w-full object-cover mt-3" style={{ maxHeight: 220 }} />}

      {body && (
        <p className="text-[14px] leading-relaxed whitespace-pre-line px-4 pt-3" style={{ color: BODY }}>
          {body}
        </p>
      )}

      <div className="pt-3">
        <Footer post={post} liked={liked} onLike={onLike} currentUserId={currentUserId} linkColor={NEWS.color} />
      </div>
    </div>
  )
}

// ── POST ──────────────────────────────────────────────────────────────────
// A neighbor's note: the casual, friendly default. Avatar-led, photo-forward.
function NoteCard({ post, liked, onLike, currentUserId }) {
  const { authorName, title, body, photoUrl, createdAt } = post

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
          style={{ background: FOREST, color: 'white' }}
        >
          {initialsOf(authorName)}
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[13.5px] font-bold truncate" style={{ color: INK }}>{authorName}</p>
          <p className="text-[11px]" style={{ color: FAINT }}>{timeAgo(createdAt)}</p>
        </div>
        <span
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0"
          style={{ background: POST.bg, color: POST.color }}
          aria-hidden="true"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
        </span>
      </div>

      {title && (
        <h3 className="text-[16px] font-bold leading-snug px-4 mt-2.5" style={{ color: INK }}>{title}</h3>
      )}
      {body && (
        <p className="text-[14px] leading-relaxed whitespace-pre-line px-4 mt-1.5" style={{ color: BODY }}>{body}</p>
      )}

      {photoUrl && <img src={photoUrl} alt={title || 'post'} className="w-full object-cover mt-3" style={{ maxHeight: 240 }} />}

      <div className="mt-3">
        <Footer post={post} liked={liked} onLike={onLike} currentUserId={currentUserId} linkColor={POST.color} />
      </div>
    </div>
  )
}

export default function PostCard({ post, currentUserId, onLike }) {
  const liked = (post.likes || []).includes(currentUserId)
  const shared = { post, liked, onLike, currentUserId }

  if (post.type === 'event') return <EventCard {...shared} />
  if (post.type === 'news') return <NewsCard {...shared} />
  return <NoteCard {...shared} />
}
