import { lazy, Suspense, useMemo, useState } from 'react'
import BottomSheet from './ui/BottomSheet'
import Toggle from './ui/Toggle'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import EmptyState from './ui/EmptyState'
import JobRow from './JobRow'
import { rankRequests } from '../utils/rankRequests'
import { haversineDistance } from '../utils/haversine'

const DispatchMap = lazy(() => import('./DispatchMap'))

const NAV_HEIGHT = 64 // BottomNav clearance for the sheet
const DEFAULT_CENTER = { lat: 10.3157, lng: 123.8854 } // no GPS, no pins: Cebu City

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--surface-ink)' }}>
      <span className="tt-live-dot" />
    </div>
  )
}

function SectionLabel({ children, aside }) {
  return (
    <div className="mb-2 mt-5 flex items-baseline justify-between">
      <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {children}
      </h2>
      {aside && (
        <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>{aside}</span>
      )}
    </div>
  )
}

// The map-first dispatch home. The map IS the screen; chrome floats on top,
// and all list content lives in the draggable BottomSheet.
export default function DispatchHome({
  requests,
  currentUser,
  onCompose,
  onAccept,
  onOpenThread,
  onOpenDispatchRadar,
  online,
  setOnline,
  location,
  nearbyCollectors,
}) {
  const myId = currentUser?.id
  const [detent, setDetent] = useState('half')
  const [selectedJobId, setSelectedJobId] = useState(null)

  const feed = useMemo(
    () => [...requests].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)),
    [requests]
  )
  const myActive = feed.filter(
    (r) => (r.postedBy === myId || r.collectedBy === myId) && r.status !== 'paid'
  )
  const openOthers = feed.filter((r) => r.status === 'open' && r.postedBy !== myId)
  const nearest = location ? rankRequests(openOthers, location) : openOthers.slice(0, 5)

  const firstPinned = feed.find((r) => r.lat != null && r.lng != null)
  const center = location || (firstPinned ? { lat: firstPinned.lat, lng: firstPinned.lng } : DEFAULT_CENTER)

  const distanceTo = (r) =>
    location && r.lat != null ? haversineDistance(location.lat, location.lng, r.lat, r.lng) : null

  return (
    <div className="fixed inset-0 mx-auto w-full max-w-[430px] overflow-hidden">
      {/* Map layer. Explicit z-0 (not the z-index:auto that "absolute" alone
          leaves) matters here: it makes this div its own stacking context, so
          Leaflet's internal panes/controls — which carry z-index up to 1000
          in leaflet.css, and otherwise escape upward because .leaflet-container
          only gets position:relative, no z-index of its own — stay contained
          below the floating chrome (z-20) and BottomSheet (z-30) instead of
          painting over them. */}
      <div className="absolute inset-x-0 top-0 z-0" style={{ bottom: NAV_HEIGHT }}>
        <Suspense fallback={<MapSkeleton />}>
          <DispatchMap
            center={center}
            zoom={14}
            jobs={openOthers}
            collectors={nearbyCollectors}
            selectedJobId={selectedJobId}
            onSelectJob={(j) => { setSelectedJobId(j.id); setDetent('half') }}
          />
        </Suspense>
      </div>

      {/* Floating top chrome */}
      <div className="absolute inset-x-3 top-3 z-20 flex flex-col gap-2">
        <div
          className="flex items-center justify-between rounded-[16px] border px-4 py-2.5"
          style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)', boxShadow: 'var(--shadow-raised)' }}
        >
          <span className="font-display text-[19px] leading-none" style={{ fontWeight: 600 }}>
            <span style={{ color: 'var(--text-on-ink)' }}>Ko</span>
            <span style={{ color: 'var(--accent)' }}>lek</span>
          </span>
          <Avatar name={currentUser?.name || '?'} />
        </div>
        <button
          onClick={onCompose}
          className="tt-press flex items-center gap-2.5 rounded-[16px] border px-4 py-3 text-left"
          style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)', boxShadow: 'var(--shadow-raised)' }}
        >
          <span className="flex-1 text-[13px]" style={{ color: 'var(--text-on-ink-muted)' }}>
            Got trash to clear? Post a pickup…
          </span>
          <span
            className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[15px] font-bold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            +
          </span>
        </button>
      </div>

      {/* Content sheet */}
      <BottomSheet detent={detent} onDetentChange={setDetent} bottomOffset={NAV_HEIGHT}>
        {!location && (
          <div
            className="mb-1 rounded-[12px] border px-3 py-2 text-[12px]"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Turn on location to go on duty and see distances — Kolek only uses it while the app is open.
          </div>
        )}
        <Toggle
          checked={online}
          onChange={location ? setOnline : () => {}}
          accent
          label={online ? 'On duty' : 'Go online'}
          sub={location ? 'Receive dispatch pings nearby' : 'Needs location access'}
        />

        <SectionLabel aside={nearest.length > 0 ? `${nearestCountLabel(nearest.length)}` : undefined}>
          Jobs nearby
        </SectionLabel>
        {nearest.length === 0 ? (
          <EmptyState
            icon="📡"
            title="No jobs nearby"
            body="You'll get pinged the moment someone posts a pickup."
          />
        ) : (
          <div className="space-y-2">
            {nearest.map((r) => (
              <JobRow
                key={r.id}
                request={r}
                distanceMeters={r.distanceMeters ?? distanceTo(r)}
                selected={selectedJobId === r.id}
                onClick={() => setSelectedJobId(selectedJobId === r.id ? null : r.id)}
                action={
                  <Button
                    full
                    size="sm"
                    style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                    onClick={(e) => { e.stopPropagation(); onAccept(r.id) }}
                  >
                    Accept for ₱{r.price}
                  </Button>
                }
              />
            ))}
          </div>
        )}

        {myActive.length > 0 && (
          <>
            <SectionLabel aside={`${myActive.length} active`}>My pickups & jobs</SectionLabel>
            <div className="space-y-2">
              {myActive.map((r) => (
                <JobRow
                  key={r.id}
                  request={r}
                  distanceMeters={distanceTo(r)}
                  selected
                  onClick={() =>
                    r.postedBy === myId && r.status === 'open' ? onOpenDispatchRadar(r) : onOpenThread(r)
                  }
                  action={
                    r.postedBy === myId && r.status === 'open' ? (
                      <Button full size="sm" variant="ink" onClick={(e) => { e.stopPropagation(); onOpenDispatchRadar(r) }}>
                        View dispatch radar
                      </Button>
                    ) : (
                      <Button full size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onOpenThread(r) }}>
                        Open chat
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}

function nearestCountLabel(n) {
  return n === 1 ? '1 open job' : `${n} open jobs`
}
