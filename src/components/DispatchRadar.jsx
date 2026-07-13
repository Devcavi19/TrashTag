import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNearbyPresence } from '../hooks/useNearbyPresence'
import MapView from './MapView'
import Avatar from './ui/Avatar'
import Button from './ui/Button'

export default function DispatchRadar({ request, onCancel, onAcceptOffer, onDeclineOffer }) {
  const [offers, setOffers] = useState([])
  const nearbyCollectors = useNearbyPresence(request.location_lat || request.lat, request.location_lng || request.lng)

  useEffect(() => {
    // Fetch existing pending offers
    supabase
      .from('price_offers')
      .select('*, profiles(name, avatar_url)')
      .eq('request_id', request.id)
      .eq('status', 'pending')
      .then(({ data }) => {
        if (data) setOffers(data)
      })

    // Subscribe to new offers
    const channel = supabase.channel(`offers:${request.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_offers', filter: `request_id=eq.${request.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch profile for the new offer
            supabase.from('profiles').select('name, avatar_url').eq('id', payload.new.collector_id).single()
              .then(({ data }) => {
                setOffers(prev => [...prev, { ...payload.new, profiles: data }])
              })
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status !== 'pending') {
              setOffers(prev => prev.filter(o => o.id !== payload.new.id))
            }
          }
        }
      ).subscribe()

    return () => supabase.removeChannel(channel)
  }, [request.id])

  return (
    <div className="flex flex-col h-full bg-[var(--surface)]">
      <div className="relative flex-1 min-h-[250px]">
        {/* Radar Map */}
        <MapView requests={[request]} />
        
        {/* Radar Overlay rings */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center isolate" style={{ zIndex: 1000 }}>
          <div className="absolute w-[22px] h-[22px] rounded-full border-2 border-[var(--brand)] tt-radar" style={{ animationDelay: '0s' }}></div>
          <div className="absolute w-[22px] h-[22px] rounded-full border-2 border-[var(--brand)] tt-radar" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute w-[22px] h-[22px] rounded-full border-2 border-[var(--brand)] tt-radar" style={{ animationDelay: '1.6s' }}></div>
        </div>
        
        {/* Nearby count badge */}
        <div className="absolute top-4 left-0 right-0 flex justify-center" style={{ zIndex: 1000 }}>
          <div className="bg-[var(--surface-card)] px-4 py-2 rounded-full shadow-[var(--shadow-raised)] border border-[var(--border)] text-sm font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand)] animate-pulse"></span>
            Broadcast active
            <span className="text-[var(--text-muted)] font-normal ml-1">· {nearbyCollectors.length} online</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-[var(--surface-card)] rounded-t-3xl shadow-[0_-8px_30px_rgba(23,61,43,0.1)] border-t border-[var(--border)] z-10 relative">
        <div className="text-center">
          <h3 className="font-bold text-[17px] mb-1">Finding a Green Collector</h3>
          <p className="text-[13px] text-[var(--text-muted)]">Your request is being shown to collectors nearby.</p>
        </div>

        {/* Offers List */}
        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
          {offers.map(offer => (
            <div key={offer.id} className="bg-[var(--surface)] p-3 rounded-2xl border border-[var(--brand)] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={offer.profiles?.name || '?'} src={offer.profiles?.avatar_url} />
                  <div>
                    <div className="text-[14px] font-semibold text-[var(--text-primary)]">{offer.profiles?.name || 'Collector'}</div>
                    <div className="text-[12px] text-[var(--brand)] font-medium">Counter-offer</div>
                  </div>
                </div>
                <div className="font-bold text-xl text-[var(--brand-ink)]">₱{offer.price}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 py-2 text-sm" onClick={() => onDeclineOffer(offer.id)}>Decline</Button>
                <Button className="flex-1 py-2 text-sm shadow-md" onClick={() => onAcceptOffer(offer.id)}>Accept</Button>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)] text-[14px] flex flex-col items-center gap-3">
              <span className="text-2xl animate-pulse">📡</span>
              Waiting for responses...
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button variant="secondary" full onClick={() => onCancel(request.id)} className="text-[var(--danger)] bg-[var(--danger)]/5 border-transparent hover:bg-[var(--danger)]/10">
            Cancel Request
          </Button>
        </div>
      </div>
    </div>
  )
}
