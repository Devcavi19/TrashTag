import { useEffect, useState } from 'react'

const CACHE_KEY = 'trashtag.lastLocation'

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { lat, lng } = JSON.parse(raw)
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng }
  } catch {
    // ignore malformed cache
  }
  return null
}

function writeCache(loc) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...loc, ts: Date.now() }))
  } catch {
    // storage unavailable (private mode, quota) — fallback still works for the session
  }
}

function hasGeolocation() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

/**
 * Resolves the viewer's location for ranking the feed.
 * Starts from the last good fix cached in localStorage so ranking can begin
 * immediately, then refines with live GPS. If GPS is denied/unavailable and
 * there's no cache, source stays 'none' and the feed renders chronologically.
 *
 * @returns {{ location: {lat:number,lng:number}|null, source: 'gps'|'cache'|'none', status: 'resolving'|'ready' }}
 */
export function useViewerLocation() {
  const [state, setState] = useState(() => {
    const cached = readCache()
    return {
      location: cached,
      source: cached ? 'cache' : 'none',
      status: hasGeolocation() ? 'resolving' : 'ready',
    }
  })

  useEffect(() => {
    if (!hasGeolocation()) return
    let cancelled = false

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        writeCache(location)
        setState({ location, source: 'gps', status: 'ready' })
      },
      () => {
        if (cancelled) return
        const cached = readCache()
        setState({ location: cached, source: cached ? 'cache' : 'none', status: 'ready' })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
