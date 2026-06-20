import { haversineDistance } from './haversine'

// Tunable ranking constants — all in one place.
export const RADIUS_METERS = 10_000 // only rank pickups within 10 km
export const HALF_LIFE_HOURS = 24 // freshness halves every 24 h
export const TOP_N = 5 // most pickups in the "nearest" section
const WEIGHTS = { distance: 0.6, freshness: 0.25, price: 0.15 }

const clamp01 = (n) => Math.max(0, Math.min(1, n))

/**
 * Ranks open pickups by a weighted blend of distance, freshness, and price.
 * Distance-dominant: the closest pickups rise to the top, with recent and
 * higher-paying posts nudged up among similarly-close ones.
 *
 * Pure function — no React, no Supabase. `requests` are app-shaped rows
 * (see useRequests dbToApp). Each returned request is annotated with
 * `distanceMeters`. Requests without coordinates or outside the radius are dropped.
 *
 * @param {Array} requests
 * @param {{lat:number,lng:number}|null} location
 * @param {{radiusMeters?:number, halfLifeHours?:number, limit?:number}} [opts]
 * @returns {Array} ranked, sliced requests with `distanceMeters`
 */
export function rankRequests(requests, location, opts = {}) {
  if (!location) return []
  const radius = opts.radiusMeters ?? RADIUS_METERS
  const halfLife = opts.halfLifeHours ?? HALF_LIFE_HOURS
  const limit = opts.limit ?? TOP_N

  const candidates = requests
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      ...r,
      distanceMeters: haversineDistance(location.lat, location.lng, r.lat, r.lng),
    }))
    .filter((r) => r.distanceMeters <= radius)

  if (candidates.length === 0) return []

  // Price is normalized against the busiest candidate so the score adapts to
  // the local payout range instead of a hard-coded ceiling.
  const maxPrice = Math.max(...candidates.map((r) => r.price || 0), 0)

  const scored = candidates.map((r) => {
    const distanceScore = 1 - clamp01(r.distanceMeters / radius)
    const ageHours = (Date.now() - new Date(r.postedAt)) / 3_600_000
    const freshnessScore = clamp01(0.5 ** (ageHours / halfLife))
    const priceScore = maxPrice > 0 ? clamp01((r.price || 0) / maxPrice) : 0
    const score =
      WEIGHTS.distance * distanceScore +
      WEIGHTS.freshness * freshnessScore +
      WEIGHTS.price * priceScore
    return { ...r, _score: score }
  })

  return scored.sort((a, b) => b._score - a._score).slice(0, limit)
}
