import TrashCard from './TrashCard'
import { rankRequests } from '../utils/rankRequests'
import Avatar from './ui/Avatar'
import EmptyState from './ui/EmptyState'
import Toggle from './ui/Toggle'
import Button from './ui/Button'

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
    <div className="flex items-baseline justify-between mt-6 mb-3">
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

export default function HomeFeed({ requests, currentUser, onCompose, onAccept, onLike, onOpenThread, onOpenDispatchRadar, credentialFor, online, setOnline, location }) {
  const myId = currentUser?.id

  // Newest first
  const feed = [...requests].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))

  // "My active pickups/jobs": own non-paid requests
  const myActive = feed.filter(r => (r.postedBy === myId || r.collectedBy === myId) && r.status !== 'paid')

  // "Jobs nearby": open requests within radius
  const openOthers = feed.filter(r => r.status === 'open' && r.postedBy !== myId)
  const nearest = rankRequests(openOthers, location)

  return (
    <div className="space-y-5 p-4">
      <ComposerPrompt user={currentUser} onCompose={onCompose} />

      <div className="bg-[var(--surface-card)] rounded-[var(--radius-card)] px-4 shadow-[var(--shadow-card)] border border-[var(--border)]">
        <Toggle 
          checked={online} 
          onChange={setOnline} 
          label="Go Online" 
          sub="Receive dispatch requests nearby" 
        />
      </div>

      {myActive.length > 0 && (
        <div className="space-y-3">
          <SectionLabel aside={`${myActive.length} active`}>My pickups & jobs</SectionLabel>
          {myActive.map((r) => (
            <div key={r.id} className="relative">
              <TrashCard
                request={r}
                currentUserId={myId}
                onAccept={onAccept}
                onLike={onLike}
                onOpenThread={onOpenThread}
                credentialFor={credentialFor}
                distanceMeters={location && r.lat && r.lng ? null : null} // distance to my own might not be needed
              />
              {/* Overlay button for poster to open Dispatch Radar on their own OPEN requests */}
              {r.postedBy === myId && r.status === 'open' && (
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <Button full onClick={() => onOpenDispatchRadar(r)} className="shadow-md font-bold text-[15px]">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                      View Dispatch Radar
                    </span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {nearest.length > 0 ? (
        <div className="space-y-3">
          <SectionLabel>Jobs nearby</SectionLabel>
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
      ) : (
        <div className="mt-8">
          <EmptyState
            icon="📡"
            title="No jobs nearby"
            body="Go online to get notified when someone posts a pickup."
          />
        </div>
      )}
    </div>
  )
}
