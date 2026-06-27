import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix default Leaflet icons broken by Vite asset hashing
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

function ClickableMap({ position, onMove }) {
  const markerRef = useRef(null)
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng)
    },
  })
  if (!position) return null
  return (
    <Marker
      draggable
      position={position}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const m = markerRef.current
          if (m) {
            const { lat, lng } = m.getLatLng()
            onMove(lat, lng)
          }
        },
      }}
    />
  )
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const d = await res.json()
    return d.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

export default function LocationPicker({ onChange }) {
  const [phase, setPhase] = useState('idle') // 'idle' | 'loading' | 'map' | 'denied'
  const [pos, setPos] = useState(null)
  const [label, setLabel] = useState('')
  const [focused, setFocused] = useState(false)

  async function pinMoved(lat, lng) {
    setPos([lat, lng])
    const lbl = await reverseGeocode(lat, lng)
    setLabel(lbl)
    onChange({ lat, lng, label: lbl })
  }

  function detect() {
    if (!navigator.geolocation) {
      setPhase('denied')
      return
    }
    setPhase('loading')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPhase('map')
        pinMoved(p.coords.latitude, p.coords.longitude)
      },
      () => setPhase('denied'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (phase === 'idle' || phase === 'loading') {
    return (
      <button
        type="button"
        onClick={detect}
        disabled={phase === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
        style={{ background: '#f0fdf4', border: '1.5px dashed #2f6b44', color: '#2f6b44' }}
      >
        {phase === 'loading' ? (
          <span>Detecting location…</span>
        ) : (
          <>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
            Use My Location
          </>
        )}
      </button>
    )
  }

  if (phase === 'denied') {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium" style={{ color: '#b53419' }}>
          Location access denied — type your address instead:
        </p>
        <input
          type="text"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            onChange({ lat: null, lng: null, label: e.target.value })
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Barangay / Street"
          className="w-full text-sm rounded-xl px-3 py-2.5 outline-none"
          style={{
            background: '#f8f7f5',
            border: focused ? '1.5px solid #2f6b44' : '1.5px solid #e2e2e0',
            color: '#1c1c1e',
          }}
        />
      </div>
    )
  }

  // phase === 'map'
  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden" style={{ height: 180, border: '1.5px solid #e2e2e0' }}>
        <MapContainer
          center={pos}
          zoom={16}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickableMap position={pos} onMove={pinMoved} />
        </MapContainer>
      </div>
      {label && (
        <p className="text-[11px] leading-tight px-1 truncate" style={{ color: '#706d67' }}>
          {label}
        </p>
      )}
      <button
        type="button"
        onClick={() => setPhase('idle')}
        className="text-[11px] font-semibold"
        style={{ color: '#a8a5a0' }}
      >
        Re-detect location
      </button>
    </div>
  )
}
