import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Full-bleed dispatch map shared by DispatchHome and DispatchRadar. Lazy-load
// it (lazy(() => import('./DispatchMap'))) so Leaflet stays in its own chunk.
// Pure presentation: everything arrives via props, nothing touches Supabase.

function priceIcon(price, selected) {
  return L.divIcon({
    className: '',
    html: `<div class="tt-price-pin${selected ? ' tt-price-pin-selected' : ''}">₱${price}</div>`,
    iconSize: [60, 32],
    iconAnchor: [30, 16],
  })
}

const liveDotIcon = L.divIcon({
  className: '',
  html: '<div class="tt-live-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const radarPinIcon = L.divIcon({
  className: '',
  html: '<div class="tt-radar-pin"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// Glides the camera when the target moves (home → radar handoff, live GPS).
function CameraFly({ lat, lng, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 })
  }, [lat, lng, zoom, map])
  return null
}

const RING_FRACTIONS = [0.33, 0.66, 1]

export default function DispatchMap({
  center,
  zoom = 15,
  jobs = [],
  collectors = [],
  radar = null,
  selectedJobId = null,
  onSelectJob,
  follow = false,
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {jobs
        .filter((j) => j.lat != null && j.lng != null)
        .map((j) => (
          <Marker
            key={j.id}
            position={[j.lat, j.lng]}
            icon={priceIcon(j.price, j.id === selectedJobId)}
            eventHandlers={{ click: () => onSelectJob?.(j) }}
          />
        ))}

      {collectors
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => (
          <Marker key={c.collectorId} position={[c.lat, c.lng]} icon={liveDotIcon} interactive={false} />
        ))}

      {radar && (
        <>
          <Marker position={[radar.lat, radar.lng]} icon={radarPinIcon} interactive={false} />
          {RING_FRACTIONS.map((f, i) => (
            <Circle
              key={f}
              center={[radar.lat, radar.lng]}
              radius={radar.radiusMeters * f}
              pathOptions={{
                color: 'var(--accent)',
                weight: 2,
                fillOpacity: 0,
                className: `tt-radar-ring tt-radar-ring-${i}`,
              }}
            />
          ))}
        </>
      )}

      {follow && <CameraFly lat={center.lat} lng={center.lng} zoom={zoom} />}
    </MapContainer>
  )
}
