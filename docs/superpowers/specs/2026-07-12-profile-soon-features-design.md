# Profile "Soon" Features: Account Settings, Notifications, Community Guidelines

**Date:** 2026-07-12
**Status:** Approved

## Goal

Replace the three "Soon" rows in ProfileView (`Account settings`, `Notifications`,
`Community guidelines`) with working features. Today each row only fires a
"coming soon" toast via `onNotice`.

## Approach

Three bottom-sheet components built on the existing `Sheet` primitive, opened
from their ProfileView rows (Soon chips removed). All Supabase writes are new
mutators in `App.jsx` threaded down as props, following the `savePaymentDetails`
pattern (write → `fetchAllProfiles()` → toast). One DB migration adds
`profiles.notification_prefs` and the `avatars` storage bucket.

Rejected alternatives: localStorage prefs (don't follow the user across
devices); a full notification-inbox table (bigger schema/UI lift than needed
now — the prefs column keeps that door open).

## 1. Account settings — `src/components/AccountSheet.jsx`

A sheet with four capabilities:

- **Avatar** — tapping the avatar opens a file picker. The file is validated by
  `src/lib/validateImage.js` (JPEG/PNG, ≤5 MB), uploaded to the public
  `avatars` bucket at `{userId}/{timestamp}.{ext}`, and `profiles.avatar_url`
  is set to the public URL. ProfileView's hero `Avatar` (and the sheet's own
  preview) pass `src={profile?.avatar_url}` — the `Avatar` primitive already
  renders an image when `src` is present.
- **Display name** — input prefilled from `profiles.name`; save updates
  `profiles.name` and mirrors into auth user metadata
  (`supabase.auth.updateUser({ data: { name } })`) since sign-up stores name
  there. Also update `currentUser.name` in state so the UI reflects it
  immediately.
- **Email** — input prefilled from `currentUser.email`; save calls
  `supabase.auth.updateUser({ email })`. Supabase sends confirmation links, so
  on success the UI shows "Check your inbox to confirm the change" rather than
  flipping instantly.
- **Password** — "New password" + "Confirm password" fields (min 6 chars,
  must match); save calls `supabase.auth.updateUser({ password })`, clears the
  fields, and toasts success.

New App.jsx mutators: `uploadAvatar(file)`, `saveAccountName(name)`,
`changeEmail(email)`, `changePassword(password)` — four separate functions so
each row of the sheet saves independently. Errors surface through the existing
notice toast.

## 2. Notifications — `src/components/NotificationsSheet.jsx` + in-app alerts

### Prefs

Three toggles persisted in a new `profiles.notification_prefs` jsonb column,
default `{"jobUpdates": true, "messages": true, "community": true}`:

| Key | Label | Sub-label |
|---|---|---|
| `jobUpdates` | Job updates | Pickup accepted, proof, payment |
| `messages` | Messages | New chat messages |
| `community` | Community | New posts and events |

A new `Toggle` primitive joins `src/components/ui/` (design-token styled,
reduced-motion aware, `aria-checked`). Toggling saves immediately (optimistic
UI, write to Supabase, revert on error).

### Alert firing (App.jsx)

Alerts are the existing `Toast` (info tone), fired only when the matching pref
is on and the user is signed in:

- **Job updates** — a `useEffect` diffs the realtime-updated `requests` state
  against a ref of previous `{id → status}`. Toast only for transitions caused
  by the *other* party on a request I'm part of:
  - I'm poster: `open→accepted` ("Your pickup was accepted"), `→collected`
    ("Cleanup proof uploaded — review it"), `→paid` ("Payment confirmed").
  - I'm collector: `→payment_sent` ("Payment sent — confirm receipt"),
    `→disputed` ("Proof was rejected — please re-upload").
  The initial fetch populates the ref without toasting.
- **Messages** — a new global realtime subscription on `messages` INSERT (RLS
  already scopes rows to requests where I'm poster/collector). Toast when
  `sender_id !== myId` and that request's thread is not currently open.
- **Community** — when `useFeed` receives a new post authored by someone else
  (diff against a ref of known post ids; initial fetch doesn't toast).

## 3. Community guidelines — `src/components/GuidelinesSheet.jsx`

Static content sheet. Structure follows the researched pattern used by
TaskRabbit / Nextdoor / Airbnb community standards and community-guidelines
best-practice guides: mission-anchored intro → short numbered principles with
concrete do/don'ts → safety → reporting → transparent enforcement, in a
welcoming second-person tone.

Content (final copy may be polished during implementation, structure is fixed):

> **Intro:** Linisa works because strangers trust each other with real money
> and real work. These guidelines keep that trust.
>
> 1. **Respect every member.** Green Collectors are professionals. No
>    harassment, discrimination, or insults in chat or posts.
> 2. **Post honestly.** Real photos of the actual trash, accurate category
>    tags, a fair offer for the work involved.
> 3. **Collect with integrity.** After-photos show the same site, actually
>    cleared. Only accept jobs you intend to finish.
> 4. **Pay fairly and promptly.** Honor the payment handshake — send what you
>    offered, confirm what you received.
> 5. **Stay safe out there.** Wear gloves, prefer daylight pickups, watch for
>    traffic and sharp objects. Skip anything hazardous and report it instead.
> 6. **Dispose responsibly.** Segregate by category and use proper barangay
>    disposal points, in the spirit of RA 9003.
>
> **Reporting:** For a job gone wrong, use the in-app review/dispute flow.
> For behavior that breaks these guidelines, contact support.
>
> **Enforcement:** warning → temporary suspension → removal, depending on
> severity. We'll always tell you why.

## 4. Database / storage migration

One migration, applied via the Supabase MCP (`apply_migration`, management API
over HTTPS); if the network blocks it, hand the SQL to the user for the
dashboard SQL editor:

```sql
alter table public.profiles
  add column notification_prefs jsonb not null
  default '{"jobUpdates": true, "messages": true, "community": true}';

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true);

create policy "Avatar upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatar update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatar delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

Notes: own-row `profiles` UPDATE RLS already exists (payment details use it);
the `profiles_guard` trigger only protects `verified_at`, so `name`,
`avatar_url`, and `notification_prefs` writes pass. Public read on `avatars`
comes from the bucket's `public` flag, matching the existing photo buckets.
`App.jsx`'s two profile `select(...)` column lists gain `notification_prefs`.

## 5. Wiring changes

- `ProfileView.jsx`: the three rows lose `hint="Soon"`/`onNotice` and open
  their sheets; hero Avatar gets `src`.
- `App.jsx`: new mutators + alert effects + global messages channel; needs to
  know which thread is open (it already renders `MessageThread`, so the active
  request id is available in existing state).
- `src/dev/preview.jsx`: new fixture screens `?screen=settings|notifprefs|guidelines`.

## 6. Verification

- Preview screens in both themes (`fresh-canopy`, `bold-impact`) for visual
  check without a backend.
- Live round-trip with the Herald/Carl test accounts: toggle prefs, exercise a
  status transition and a chat message from the counterpart account, confirm
  toasts appear (and stay silent when the pref is off).
- `npm run lint` and `npm run build` pass.

## Out of scope

- OS/push notifications (FCM, service-worker push).
- A notification inbox/history view.
- Account deletion (needs service-role backend).
- Threading `avatar_url` into every `Avatar` consumer (TrashCard,
  Leaderboard, Conversations) — a natural follow-up once uploads exist.
