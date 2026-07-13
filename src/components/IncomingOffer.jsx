import { useState } from 'react'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import StatusBadge from './StatusBadge'
import CountdownRing from './CountdownRing'
import { formatDistance } from '../utils/haversine'
import sampleTrash from '../assets/sample_trash.jpg'

const OFFER_SECONDS = 25

// Collector-side dispatch ping: a takeover constrained to the 430px shell.
// The countdown expiring minimizes the takeover (onDismiss) — the job simply
// stays in the "Jobs nearby" sheet list. Pass (onPass) is the explicit
// don't-show-again action.
export default function IncomingOffer({ request, poster, distanceMeters, onAccept, onPass, onCounter, onDismiss }) {
  const [counterPrice, setCounterPrice] = useState('')
  const [isCountering, setIsCountering] = useState(false)

  return (
    <div
      className="tt-sheet fixed inset-0 z-[1000] mx-auto flex w-full max-w-[430px] flex-col"
      style={{ background: 'var(--surface)' }}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <h2 className="mt-1 text-center font-display text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          New pickup request
        </h2>

        <div className="relative overflow-hidden rounded-[16px]" style={{ boxShadow: 'var(--shadow-card)' }}>
          <img
            src={request.photo || sampleTrash}
            alt="Trash to collect"
            className="h-56 w-full object-cover"
            onError={(e) => { if (e.currentTarget.src !== sampleTrash) e.currentTarget.src = sampleTrash }}
          />
          <div
            className="absolute bottom-3 right-3 rounded-full px-3.5 py-1.5 font-display text-[18px] font-bold"
            style={{ background: 'var(--surface-ink)', color: 'var(--accent)', border: '1.5px solid var(--border-ink)' }}
          >
            ₱{request.price}
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-[14px] border p-3"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <Avatar name={poster?.name || '?'} src={poster?.avatar_url} />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {poster?.name || 'Someone'}
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {request.gps || 'Nearby pickup'}
              {distanceMeters != null && <> · {formatDistance(distanceMeters)}</>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={request.tags} />
        </div>
      </div>

      <div className="flex-none space-y-3 border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {isCountering ? (
          <div
            className="space-y-3 rounded-[16px] border p-4"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-center text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Offer a different price
            </h3>
            <div className="flex gap-2">
              <span
                className="flex items-center justify-center rounded-[12px] border px-4 font-display text-lg font-bold"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                ₱
              </span>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="tt-input flex-1 p-3 text-lg font-bold"
                placeholder={String(request.price)}
                min="1"
                max="99999"
                step="1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCountering(false)}>
                Back
              </Button>
              <Button
                className="flex-1"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                disabled={!counterPrice || Number(counterPrice) <= 0}
                onClick={() => onCounter(request.id, Number(counterPrice))}
              >
                Send offer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              full
              className="py-3.5 text-[17px]"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              onClick={() => onAccept(request.id)}
            >
              <CountdownRing seconds={OFFER_SECONDS} onExpire={onDismiss} />
              Accept for ₱{request.price}
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCountering(true)}>
                Offer a price
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => onPass(request.id)}>
                Pass
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
