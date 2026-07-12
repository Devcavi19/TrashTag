// In-app alert preferences, stored per-user in profiles.notification_prefs.
// Merging over defaults keeps older rows (or a partial jsonb) safe.
export const DEFAULT_PREFS = { jobUpdates: true, messages: true, community: true }

export function prefsOf(profile) {
  return { ...DEFAULT_PREFS, ...(profile?.notification_prefs ?? {}) }
}
