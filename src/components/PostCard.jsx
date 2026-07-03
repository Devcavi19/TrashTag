// Community feed cards. The signature of this feed is that each post *type* is a
// different object, not the same card with a different stripe:
//   event → a tear-off invite with a calendar date block
//   news  → an editorial bulletin clipping (serif headline, source-forward)
//   post  → a neighbor's note (casual, avatar- and photo-forward)
// You can tell them apart mid-scroll without reading the badge.

import Avatar from './ui/Avatar'

const INK = 'var(--text-primary)'
const BODY = 'var(--text-secondary)'
const FAINT = 'var(--text-muted)'
const LIKE_ON = 'var(--danger)'

const tint = (token) => `color-mix(in srgb, ${token} 14%, transparent)`

const EVENT = { color: 'var(--success)', bg: tint('var(--success)') }
const NEWS = { color: 'var(--tag-rec-fg)', bg: 'var(--tag-rec-bg)' }
const POST = { color: 'var(--accent)', bg: tint('var(--accent)') }

const CARD_STYLE = {
  background: 'var(--surface-card)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-card)',
}

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
      className="tt-press flex items-center gap-1.5 text-[13px] font-semibold"
      style={{ color: liked ? LIKE_ON : FAINT }}
      aria-pressed={liked}
    >
      <svg className={liked ? 'tt-pop' : ''} width="17" height="17" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      className="tt-press flex items-center gap-1.5 text-[13px] font-semibold"
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
    <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
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
    <div className="overflow-hidden" style={CARD_STYLE}>
      <div className="flex">
        {/* Date block — the hero */}
        <div
          className="flex flex-shrink-0 flex-col items-center justify-center px-3 py-4"
          style={{
            width: 72,
            background: 'var(--brand-ink)',
            color: 'var(--on-brand-ink)',
            borderRight: '2px dashed color-mix(in srgb, var(--on-brand-ink) 45%, transparent)',
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
        <div className="min-w-0 flex-1 px-3.5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: EVENT.color }}>
            Community event
          </span>
          {title && (
            <h3 className="font-display mt-0.5 text-[17px] leading-snug" style={{ color: INK, fontWeight: 600 }}>
              {title}
            </h3>
          )}
          {eventLocation && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: EVENT.color }}>
              <PinIcon />
              <span className="truncate">{eventLocation}</span>
            </div>
          )}
          {body && (
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: BODY, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {body}
            </p>
          )}
          <p className="mt-2 text-[11px]" style={{ color: FAINT }}>
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
    <div className="overflow-hidden" style={{ ...CARD_STYLE, borderLeft: `3px solid ${NEWS.color}` }}>
      <div className="px-4 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full" style={{ background: NEWS.color }} />
          <span className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: NEWS.color }}>
            Bulletin
          </span>
        </div>

        {title && (
          <h3 className="font-display mt-1.5 text-[19px] leading-tight" style={{ color: INK, fontWeight: 600 }}>
            {title}
          </h3>
        )}

        <p className="mt-1.5 text-[11px] font-medium" style={{ color: FAINT }}>
          Reported by {authorName} · {timeAgo(createdAt)}
        </p>
      </div>

      {photoUrl && <img src={photoUrl} alt={title || 'news'} className="mt-3 w-full object-cover" style={{ maxHeight: 220 }} />}

      {body && (
        <p className="whitespace-pre-line px-4 pt-3 text-[14px] leading-relaxed" style={{ color: BODY }}>
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
    <div className="overflow-hidden" style={CARD_STYLE}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <Avatar name={authorName} className="flex-shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13.5px] font-bold" style={{ color: INK }}>{authorName}</p>
          <p className="text-[11px]" style={{ color: FAINT }}>{timeAgo(createdAt)}</p>
        </div>
        <span
          className="ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: POST.bg, color: POST.color }}
          aria-hidden="true"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
        </span>
      </div>

      {title && (
        <h3 className="mt-2.5 px-4 text-[16px] font-bold leading-snug" style={{ color: INK }}>{title}</h3>
      )}
      {body && (
        <p className="mt-1.5 whitespace-pre-line px-4 text-[14px] leading-relaxed" style={{ color: BODY }}>{body}</p>
      )}

      {photoUrl && <img src={photoUrl} alt={title || 'post'} className="mt-3 w-full object-cover" style={{ maxHeight: 240 }} />}

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
