import StatusBadge from './StatusBadge'

function initialsOf(name) {
  return name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?'
}

export default function Conversations({ requests, currentUser, users, onClose, onOpenThread }) {
  const myId = currentUser?.id
  const threads = requests
    .filter((r) => (r.postedBy === myId || r.collectedBy === myId) && r.status !== 'open')
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))

  function counterpartName(r) {
    const otherId = r.postedBy === myId ? r.collectedBy : r.postedBy
    if (!otherId) return 'Unknown'
    return users.find((u) => u.id === otherId)?.name ?? 'Unknown'
  }

  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col"
      style={{ background: '#f3f4f2' }}
    >
      <div
        className="flex flex-shrink-0 items-center gap-3 bg-white px-4 py-3"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: '#f3f4f2', color: '#706d67' }}
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span className="font-display text-[20px]" style={{ color: '#0d3320', fontWeight: 600 }}>
          Messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <span className="text-3xl" style={{ opacity: 0.25 }}>💬</span>
            <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
              No conversations yet. Accept a pickup or wait for someone to accept yours.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((r) => {
              const role = r.postedBy === myId ? 'You posted' : 'You collect'
              return (
                <button
                  key={r.id}
                  onClick={() => onOpenThread(r)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left transition-all active:scale-[0.99]"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
                >
                  <span
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: '#0d3320' }}
                  >
                    {initialsOf(counterpartName(r))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: '#1c1c1e' }}>
                      {counterpartName(r)}
                    </p>
                    <p className="truncate text-xs" style={{ color: '#a8a5a0' }}>
                      {role} · {r.gps} · ₱{r.price}
                    </p>
                  </div>
                  <StatusBadge variant={r.status} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
