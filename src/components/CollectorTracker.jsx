import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import MapView from './MapView'
import { haversineDistance, proximityLabel, formatDistance } from '../utils/haversine'

const STATUS_COLORS = {
  'Collector arrived': '#2f6b44',
  'Collector is nearby': '#c97f1e',
  'Collector on the way': '#706d67',
}

export default function CollectorTracker({ request }) {
  const [collectorLocation, setCollectorLocation] = useState(null)

  useEffect(() => {
    if (!request?.id) return

    // Fetch existing location on mount
    supabase
      .from('collector_locations')
      .select('lat, lng')
      .eq('request_id', request.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setCollectorLocation({ lat: Number(data.lat), lng: Number(data.lng) })
      })

    // Subscribe to live updates
    const channel = supabase
      .channel(`collector_loc:${request.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collector_locations',
          filter: `request_id=eq.${request.id}`,
        },
        (payload) => {
          const { lat, lng } = payload.new
          setCollectorLocation({ lat: Number(lat), lng: Number(lng) })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [request?.id])

  // Nothing to show if request has no pinned location
  if (!request?.lat || !request?.lng) return null

  const distance =
    collectorLocation != null
      ? haversineDistance(request.lat, request.lng, collectorLocation.lat, collectorLocation.lng)
      : null

  const label = distance != null ? proximityLabel(distance) : 'Waiting for collector…'
  const labelColor = STATUS_COLORS[label] ?? '#706d67'

  return (
    <div className="space-y-2 mt-2">
      {/* Status pill */}
      <div className="flex items-center gap-2 px-1">
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: labelColor,
            flexShrink: 0,
          }}
        />
        <span className="text-xs font-semibold" style={{ color: labelColor }}>
          {label}
          {distance != null && (
            <span className="font-normal ml-1" style={{ color: '#a8a5a0' }}>
              · {formatDistance(distance)}
            </span>
          )}
        </span>
      </div>

      {/* Live map */}
      <MapView
        requests={[request]}
        collectorLocation={collectorLocation}
        trackCollector
      />
    </div>
  )
}
