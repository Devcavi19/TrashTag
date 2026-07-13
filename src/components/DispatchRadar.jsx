import { lazy, Suspense } from 'react'
import Avatar from './ui/Avatar'
import Button from './ui/Button'

const DispatchMap = lazy(() => import('./DispatchMap'))

const BROADCAST_RADIUS_METERS = 5000

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--surface-ink)' }}>
      <span className="tt-live-dot" />
    </div>
  )
}

// Poster-side radar: the pickup pin with pulsing 5 km broadcast rings, live
// collector dots, and incoming counter-offers. Pure presentation — offers and
// presence arrive via props (useOffers / useNearbyPresence in App.jsx).
export default function DispatchRadar({ request, collectors, offers, onCancel, onAcceptOffer, onDeclineOffer }) {
  const online = collectors.length

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--surface)' }}>
      <div className="relative min-h-[240px] flex-1">
        <Suspense fallback={<MapSkeleton />}>
          <DispatchMap
            center={{ lat: request.lat, lng: request.lng }}
            zoom={13}
            collectors={collectors}
            radar={{ lat: request.lat, lng: request.lng, radiusMeters: BROADCAST_RADIUS_METERS }}
          />
        </Suspense>

        {/* Live broadcast pill */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center">
          <div
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
            style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)', color: 'var(--text-on-ink)' }}
          >
            <span className="tt-live-dot" style={{ width: 10, height: 10 }} />
            Broadcast active
            <span style={{ color: 'var(--text-on-ink-muted)', fontWeight: 400 }}>
              · {online} on duty nearby
            </span>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 space-y-4 p-4"
        style={{
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          marginTop: -22,
          boxShadow: 'var(--shadow-raised)',
        }}
      >
        <div className="text-center">
          <h3 className="font-display text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Finding your Green Collector
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {online > 0
              ? 'Your request is live on the radar of collectors nearby.'
              : 'Nobody is on duty right now — your request stays posted, and collectors get pinged as they come online.'}
          </p>
        </div>

        <div className="max-h-[36vh] space-y-2.5 overflow-y-auto">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-[14px] border p-3"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--accent)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={offer.profiles?.name || '?'} src={offer.profiles?.avatar_url} />
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {offer.profiles?.name || 'Green Collector'}
                    </div>
                    <div className="text-[12px] font-medium" style={{ color: 'var(--warning)' }}>
                      Counter-offer
                    </div>
                  </div>
                </div>
                <div className="font-display text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  ₱{offer.price}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => onDeclineOffer(offer.id)}>
                  Decline
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                  onClick={() => onAcceptOffer(offer.id)}
                >
                  Accept ₱{offer.price}
                </Button>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Waiting for responses…
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          full
          onClick={() => onCancel(request.id)}
          style={{ color: 'var(--danger)' }}
        >
          Cancel request
        </Button>
      </div>
    </div>
  )
}
