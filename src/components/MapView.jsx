import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const TYPE_COLORS = {
  Biodegradable: '#22863a',
  Recyclable: '#1966b5',
  Residual: '#b53419',
}

function pinIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

const collectorIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#0d3320;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(13,51,32,0.25),0 2px 8px rgba(0,0,0,0.4)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// Smoothly re-centers the map when the collector moves
function LiveRecenter({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { animate: true, duration: 0.8 })
  }, [lat, lng, map])
  return null
}

export default function MapView({ requests, onSelectRequest, collectorLocation, trackCollector }) {
  const pinned = (requests ?? []).filter((r) => r.lat != null && r.lng != null)

  if (pinned.length === 0 && !collectorLocation) return null

  let centerLat, centerLng
  if (collectorLocation && pinned.length > 0) {
    centerLat = (collectorLocation.lat + pinned[0].lat) / 2
    centerLng = (collectorLocation.lng + pinned[0].lng) / 2
  } else if (collectorLocation) {
    centerLat = collectorLocation.lat
    centerLng = collectorLocation.lng
  } else {
    centerLat = pinned.reduce((s, r) => s + r.lat, 0) / pinned.length
    centerLng = pinned.reduce((s, r) => s + r.lng, 0) / pinned.length
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        height: 200,
        boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)',
        // Contain Leaflet's high z-index panes so they can't paint over fixed overlays (chat, modals).
        isolation: 'isolate',
      }}
    >
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {pinned.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={pinIcon(TYPE_COLORS[r.type] ?? '#706d67')}
            eventHandlers={{ click: () => onSelectRequest?.(r) }}
          >
            <Popup>
              <div style={{ fontSize: 13, minWidth: 130 }}>
                <strong>{r.type}</strong>
                <br />
                <span style={{ color: '#c97f1e', fontWeight: 700 }}>₱{r.price}</span>
                <br />
                {r.gps && (
                  <span style={{ color: '#706d67', fontSize: 11 }}>
                    {r.gps.split(',').slice(0, 2).join(',')}
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {collectorLocation && (
          <Marker
            position={[collectorLocation.lat, collectorLocation.lng]}
            icon={collectorIcon}
          >
            <Popup>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Collector</span>
            </Popup>
          </Marker>
        )}

        {trackCollector && collectorLocation && (
          <LiveRecenter lat={collectorLocation.lat} lng={collectorLocation.lng} />
        )}
      </MapContainer>
    </div>
  )
}
