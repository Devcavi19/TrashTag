import { useState } from 'react'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import StatusBadge from './StatusBadge'
import { formatDistance } from '../utils/haversine'
import sampleTrash from '../assets/sample_trash.jpg'
import CollectorCredential from './CollectorCredential'

export default function IncomingOffer({ request, poster, credentialFor, distanceMeters, onAccept, onPass, onCounter }) {
  const [counterPrice, setCounterPrice] = useState('')
  const [isCountering, setIsCountering] = useState(false)

  const handleCounter = () => {
    if (!counterPrice) return
    onCounter(request.id, Number(counterPrice))
  }

  // The collector sees the poster's request. We show poster info.
  // The task mentions `credentialFor`, which might be used if we show credentials.
  // We'll pass it down in case the poster has a credential, though it's typically for collectors.
  const credential = poster ? credentialFor?.(poster.id) : null

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-[var(--surface)] p-4 tt-sheet overflow-hidden isolate" style={{ isolation: 'isolate' }}>
      <div className="flex-1 overflow-y-auto space-y-4 pb-24">
        <h2 className="text-[22px] font-bold text-center mt-2" style={{ fontFamily: 'var(--font-display)' }}>New Pickup Request</h2>
        
        <div className="relative rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <img 
            src={request.photo_url || request.photo || sampleTrash} 
            alt="Trash" 
            className="w-full h-56 object-cover" 
            onError={(e) => {
              if (e.currentTarget.src !== sampleTrash) e.currentTarget.src = sampleTrash
            }}
          />
          <div className="absolute bottom-3 right-3 bg-[var(--brand-ink)] text-[var(--on-brand-ink)] font-bold px-3 py-1.5 rounded-lg shadow-md text-lg">
            ₱{request.price}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[var(--surface-card)] p-3 rounded-xl border border-[var(--border)] shadow-[var(--shadow-card)]">
          <Avatar name={poster?.name || '?'} src={poster?.avatar_url} />
          <div className="flex-1">
            <div className="font-semibold text-[15px]">{poster?.name || 'Someone'}</div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
              {request.location_label || 'Nearby pickup'} 
              {distanceMeters != null && <span>· {formatDistance(distanceMeters)}</span>}
            </div>
          </div>
        </div>

        {credential && (
          <div className="mt-2">
            <CollectorCredential {...credential} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <StatusBadge variant={request.tags} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface)] border-t border-[var(--border)] space-y-3 z-10 max-w-[430px] mx-auto">
        {isCountering ? (
          <div className="bg-[var(--surface-card)] p-4 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
            <h3 className="font-semibold text-center text-[15px]">Offer a different price</h3>
            <div className="flex gap-2">
              <span className="flex items-center justify-center bg-[var(--surface)] px-4 rounded-xl font-bold border border-[var(--border)] text-lg">₱</span>
              <input 
                type="number" 
                value={counterPrice} 
                onChange={e => setCounterPrice(e.target.value)}
                className="tt-input flex-1 p-3 font-bold text-lg"
                placeholder={request.price.toString()}
                min="1"
                max="99999"
                step="1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCountering(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCounter} disabled={!counterPrice || Number(counterPrice) <= 0}>Send Offer</Button>
            </div>
          </div>
        ) : (
          <>
            <Button full size="large" onClick={() => onAccept(request.id)} className="text-lg py-3.5 shadow-md">
              Accept for ₱{request.price}
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCountering(true)}>
                Offer Price
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
