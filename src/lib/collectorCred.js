// Green Collector credential — derived, not stored. The only stored fact is
// profiles.verified_at (granted by Kolek, guarded by profiles_guard);
// everything else is computed from live requests so the credential can never
// contradict the visible record.

export const TOP_RATED_MIN_PICKUPS = 20
export const TOP_RATED_MIN_RATING = 4.8

// The career ladder, in display order. `locked` rungs are the roadmap —
// visible ambition with no progression logic behind them yet.
export const TIER_LADDER = [
  { id: 'verified', label: 'Verified', detail: 'Identity confirmed by Kolek' },
  { id: 'certified', label: 'Certified', detail: 'TESDA solid waste management', locked: true },
  { id: 'top-rated', label: 'Top-Rated', detail: `${TOP_RATED_MIN_PICKUPS}+ pickups at ★${TOP_RATED_MIN_RATING}+` },
  { id: 'team-lead', label: 'Team Lead', detail: 'Leads a collector team', locked: true },
  { id: 'coordinator', label: 'Barangay Coordinator', detail: 'Runs the barangay corps', locked: true },
]

// profile is a raw `profiles` row (snake_case — profiles aren't mapped through
// a dbToApp); requests are the app-shaped rows from useRequests.
export function deriveCredential(requests, profile) {
  const id = profile?.id
  // "Pickups completed" means the fully settled handshake — disputed and
  // in-flight jobs don't count toward the credential.
  const done = id ? requests.filter((r) => r.collectedBy === id && r.status === 'paid') : []
  const rated = done.filter((r) => r.rating != null)
  const rating = rated.length ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length : null

  const verified = Boolean(profile?.verified_at)
  const topRated =
    verified && done.length >= TOP_RATED_MIN_PICKUPS && rating != null && rating >= TOP_RATED_MIN_RATING
  // Highest achieved rung; Certified is not derivable yet and never gates Top-Rated.
  const tier = topRated ? 'top-rated' : verified ? 'verified' : null

  return {
    verified,
    pickups: done.length,
    rating,
    ratingCount: rated.length,
    tier,
    tierLabel: TIER_LADDER.find((t) => t.id === tier)?.label ?? null,
    memberSince: profile?.created_at ?? null,
  }
}
