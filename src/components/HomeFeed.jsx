import TrashCard from './TrashCard'
import { useViewerLocation } from '../hooks/useViewerLocation'
import { rankRequests } from '../utils/rankRequests'
import Avatar from './ui/Avatar'
import EmptyState from './ui/EmptyState'

function ComposerPrompt({ user, onCompose }) {
  return (
    <button
      onClick={onCompose}
      className="tt-press flex w-full items-center gap-3 px-4 py-3 text-left"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <Avatar name={user?.name || '?'} />
      <span className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Got trash to clear? Post a pickup…
      </span>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>
  )
}

function SectionLabel({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {children}
      </h2>
      {aside && (
        <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>
          {aside}
        </span>
      )}
    </div>
  )
}

export default function HomeFeed({ requests, currentUser, onCompose, onAccept, onLike, onOpenThread, credentialFor }) {
  const myId = currentUser?.id
  const { location } = useViewerLocation()

  // Newest first (the hook already orders requests desc, but be explicit for the feed).
  const feed = [...requests].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))

  // Closest open pickups, scored by distance + freshness + price.
  const open = feed.filter((r) => r.status === 'open')
  const nearest = rankRequests(open, location)
  const nearestIds = new Set(nearest.map((r) => r.id))

  // Everything else, newest first — minus what's already surfaced above and
  // minus completed pickups: once a job is paid it leaves the live feed.
  const rest = feed.filter((r) => !nearestIds.has(r.id) && r.status !== 'paid')

  return (
    <div className="space-y-5 p-4">
      <ComposerPrompt user={currentUser} onCompose={onCompose} />

      {nearest.length > 0 && (
        <div className="space-y-3">
          <SectionLabel aside="Closest to you">Nearest open pickups</SectionLabel>
          {nearest.map((r) => (
            <TrashCard
              key={r.id}
              request={r}
              currentUserId={myId}
              onAccept={onAccept}
              onLike={onLike}
              onOpenThread={onOpenThread}
              credentialFor={credentialFor}
              distanceMeters={r.distanceMeters}
            />
          ))}
        </div>
      )}

      {nearest.length === 0 && rest.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="No pickups nearby yet"
          body="Post the first one and a Green Collector will come running."
        />
      ) : (
        <div className="space-y-3">
          {nearest.length > 0 && rest.length > 0 && (
            <SectionLabel>More in the community</SectionLabel>
          )}
          {rest.map((r) => (
            <TrashCard
              key={r.id}
              request={r}
              currentUserId={myId}
              onAccept={onAccept}
              onLike={onLike}
              onOpenThread={onOpenThread}
              credentialFor={credentialFor}
            />
          ))}
        </div>
      )}
    </div>
  )
}
