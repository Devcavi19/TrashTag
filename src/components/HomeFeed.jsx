import TrashCard from './TrashCard'
import Leaderboard from './Leaderboard'
import MapView from './MapView'

function ComposerPrompt({ user, onCompose }) {
  const initials = user
    ? user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  return (
    <button
      onClick={onCompose}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left transition-all active:scale-[0.99]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: '#0d3320' }}
      >
        {initials}
      </span>
      <span className="flex-1 text-sm" style={{ color: '#a8a5a0' }}>
        Got trash to clear? Post a pickup…
      </span>
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: '#fef3e0', color: '#c97f1e' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>
  )
}

export default function HomeFeed({ requests, currentUser, users, onCompose, onAccept, onLike, onOpenThread }) {
  const myId = currentUser?.id
  // Newest first (the hook already orders requests desc, but be explicit for the feed).
  const feed = [...requests].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
  const openWithCoords = feed.filter((r) => r.status === 'open' && r.lat != null)

  return (
    <div className="space-y-4 p-4">
      <ComposerPrompt user={currentUser} onCompose={onCompose} />

      {openWithCoords.length > 0 && (
        <div>
          <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#a8a5a0' }}>
            Open pickups near you
          </h2>
          <MapView requests={openWithCoords} />
        </div>
      )}

      {feed.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <span className="text-3xl" style={{ opacity: 0.25 }}>🌱</span>
          <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
            Nothing here yet. Post the first pickup!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((r) => (
            <TrashCard
              key={r.id}
              request={r}
              currentUserId={myId}
              onAccept={onAccept}
              onLike={onLike}
              onOpenThread={onOpenThread}
            />
          ))}
        </div>
      )}

      <Leaderboard requests={requests} users={users} />
    </div>
  )
}
