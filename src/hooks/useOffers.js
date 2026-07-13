import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Pending price offers for one request (poster side): fetch once, then track
// INSERTs (enriched with the collector's profile) and drop offers that leave
// `pending`. Returns [] while requestId is null.
export function useOffers(requestId) {
  const [offers, setOffers] = useState([])

  useEffect(() => {
    if (!requestId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOffers([])
      return
    }
    setOffers([])

    supabase
      .from('price_offers')
      .select('*, profiles(name, avatar_url)')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .then(({ data }) => {
        if (data) setOffers(data)
      })

    const channel = supabase
      .channel(`offers:${requestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_offers', filter: `request_id=eq.${requestId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', payload.new.collector_id)
              .single()
              .then(({ data }) => {
                setOffers((prev) => [...prev, { ...payload.new, profiles: data }])
              })
          } else if (payload.eventType === 'UPDATE' && payload.new.status !== 'pending') {
            setOffers((prev) => prev.filter((o) => o.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [requestId])

  return offers
}
