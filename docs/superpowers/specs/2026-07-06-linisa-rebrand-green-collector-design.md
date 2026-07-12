# Kolek Rebrand & Green Collector Identity — Design

**Date:** 2026-07-06
**Status:** Approved

## Vision

TrashTag becomes **Kolek** — no longer "an app that lets you pay a neighbor to haul
your trash" but the platform that turns informal waste-picking into a recognized
profession. The transaction loop already built (Post → Accept → Collect → Pay) is the
skeleton and does not change. What changes is the identity of one actor inside it: the
collector goes from an anonymous nearby neighbor to a **verified, rated, credentialed
member of the Kolek workforce** — a Green Collector. The app is the coordination
layer; the professionalized collector is the product.

**Brand:** product name is **Kolek**; tagline is
**"Professional Green Collectors, one trash at a time."**

**Hard constraint:** the poster experience gains **zero taps**. Professionalization is
passively visible to posters, never friction.

## Scope

This pass delivers:

1. A persistent, credentialed Green Collector identity (one migration + derivation).
2. A poster-side trust surface (credential line + tappable credential sheet).
3. A collector-side dignity view (badge, tier, "My Green Collector ID").
4. A static certification guide (the career ladder made actionable).
5. The full rename/copy sweep to Kolek and Green Collector language.

Explicitly **out of scope** (shown in UI as "coming", not built): the verification
pipeline (gov ID + selfie), TESDA certification with real teeth, QR-ID scanning,
tier progression logic, PPE/insurance, LGU dashboard.

## 1. Data model & credential derivation

### Migration (the only schema change)

- `alter table profiles add column verified_at timestamptz;` — null = unverified.
  Set manually via SQL/dashboard for now; the future verification pipeline is what
  will write it. World-readable like the rest of the profile — a credential is
  meant to be seen.
- **`profiles_guard` trigger** (same pattern as the existing `requests_guard`):
  users can already `update` their own profile row (that's how GCash/Maya numbers
  are saved in `App.jsx`), so without a guard a user could self-verify through the
  API. The trigger rejects any change to `verified_at` not made by the service role.

### Derivation — `src/lib/collectorCred.js` (new)

Everything else is computed client-side from data already present via `useRequests`
and the `profiles` state. Exports one canonical function
`deriveCredential(requests, profile)` returning `{ pickups, rating, tier, verified }`:

- **Pickups completed** — requests where `collectedBy === profile.id` and
  `status === 'paid'` (the fully settled handshake; disputed and in-flight jobs
  don't count).
- **Rating** — average of `rating` (the poster's rating of the collector) over those
  rows where it is non-null; null when no ratings yet (render as "—").
- **Tier** — highest achieved of:
  - *(unverified)* → plain "Green Collector", no badge; ladder shows Verified as
    the next rung.
  - **Verified** — `verified_at` is set.
  - **Top-Rated** — verified AND ≥ 20 paid pickups AND rating ≥ 4.8.
  - **Certified (TESDA)**, **Team Lead**, **Barangay Coordinator** — locked
    "coming" rungs, display only. Certified sits between Verified and Top-Rated in
    the ladder display, but since it is not derivable yet it never gates Top-Rated.

### App.jsx plumbing

`fetchProfile` / `fetchAllProfiles` widen their `select` to include
`verified_at, avatar_url, created_at` so every surface can render the credential
without new queries. No new realtime subscriptions.

## 2. UI surfaces

### `CollectorCredential` (new component)

The compact trust line: mini avatar + "Mang Ramon · ✓ Verified Green Collector ·
★4.9 · 214 pickups". Unverified collectors render as "Green Collector" with no
checkmark. Tappable → opens `CredentialSheet`. Rendered on the poster side wherever
the collector appears:

- **TrashCard** — once `status` is `accepted` or beyond, poster view.
- **MessageThread header** — replaces the plain counterpart name when the viewer is
  the poster.
- **CollectorTracker** — alongside the proximity label.

### `CredentialSheet` (new component)

Uses the existing `Sheet` idiom. A professional ID card:

- Avatar, name, verified badge, tier chip.
- Stats row: pickups · rating · member since (`profiles.created_at`).
- The five-rung ladder — achieved rungs lit; Certified / Team Lead / Barangay
  Coordinator shown locked with a "coming" marker.
- "How do I get certified?" link at the bottom → certification guide.

Reused for the collector's own view from ProfileView ("My Green Collector ID").

### Certification guide (new, static content sheet)

"Becoming a Certified Green Collector" — the path in steps:

1. Join and get identity-verified.
2. Complete jobs and keep your rating high.
3. Basic safety and waste-segregation training.
4. TESDA certification in solid waste management.
5. Grow into Team Lead / **Barangay Coordinator — Green Collectors organize as a
   recognized barangay corps** that LGUs can endorse and contract.

Framed as a roadmap ("here's where this is going"); honest that certification
onboarding opens later. Reachable from the CredentialSheet ladder and from a
ProfileView action row.

### ProfileView (dignity view)

- Derived title becomes "Green Collector" (or the tier name once verified).
- Verified badge next to the name.
- "My Green Collector ID" action row → own CredentialSheet.
- Existing stats untouched.

### Preview harness

`preview.html` fixtures gain verified / top-rated / unverified collector examples
and a `?screen=credential` entry so all surfaces are verifiable without a backend,
in both themes.

## 3. Rename sweep

- **Brand:** `TrashTag` / `TrashTag PH` → **Kolek** everywhere user-facing —
  `index.html` title/OG ("Kolek — Professional Green Collectors, one trash at a
  time"), PWA manifest name/short_name in `vite.config.js`, LoadingScreen wordmark,
  Landing, ProfileView footer, email templates, `themes.js` blurb, README.
- **Landing page copy** rewritten to the workforce positioning: hero leads with the
  tagline; sections reframed for the three audiences — collectors (income + career
  path), homeowners (trusted professional at the gate), barangay/LGU (a certified
  green-jobs corps). Impact strip stays.
- **Copy sweep:** user-facing "collector" → "Green Collector" (TrashCard actions,
  MessageThread, StatusBadge labels, empty states). **Code identifiers and DB
  columns (`collected_by`, `collectorRating`, …) do not change.**
- **Internals:** `package.json` name → `linisa`; storage keys `trashtag:*` /
  `trashtag.*` / `trashtag-*` → `linisa:*` equivalents (one-time theme/idle reset
  for existing sessions — acceptable pre-launch); CLAUDE.md updated to describe the
  new positioning and credential model.

## Error handling

- Missing/incomplete profile data (no avatar, no ratings yet) renders gracefully:
  initials avatar, "—" rating, 0 pickups.
- The guard trigger failing closed is the security boundary; the client never
  offers a write path to `verified_at`.
- Realtime behavior unchanged — no new subscriptions, no new failure modes.

## Verification

No test runner exists. Verify via:

1. `/preview.html` — credential line, sheet, guide, ProfileView, Landing in both
   themes (`fresh-canopy`, `bold-impact`).
2. Live dev pass with the Herald/Carl test accounts: verify one account via SQL,
   run a job through the full loop, confirm the trust line and sheet render on the
   poster side at `accepted`/`collected`/`paid`.
3. Confirm the guard: attempt to set `verified_at` with the anon key as the profile
   owner — must be rejected.
4. `npm run build` + `npm run preview` — PWA manifest carries the Kolek name.
   (Icon artwork in `public/pwa-*.png` is unchanged in this pass — a new logo is a
   separate design task.)
