# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint over the repo
- `npm run db:backup` — export all Supabase table data to a timestamped SQL file in `backups/` (needs `SUPABASE_SERVICE_ROLE_KEY`)

There is no test runner configured. `playwright` is installed as a devDependency but no test suite exists yet. `scripts/verify-*.mjs` are standalone Node smoke tests that subscribe to a live project and report realtime events; run them with `node scripts/verify-realtime.mjs` (also `verify-feed-realtime`, `verify-chat-realtime`).

## What this is

Kolek (formerly TrashTag; tagline "Professional Green Collectors, one trash at a time") is a mobile-first (430px max-width) React 19 + Vite single-page app: a two-sided marketplace where **Posters** create trash-pickup requests and **Green Collectors** accept and fulfill them, plus a shared **Community** feed. The positioning is workforce-first — the collector is a verified, rated, credentialed professional; the app is the coordination layer. It is backed by **Supabase** (Postgres, Auth, Storage, Realtime); the browser talks to Supabase directly with the anon key, so **Row-Level Security is the authorization boundary**. Code identifiers and DB columns keep the original `collector`/`poster` naming — only user-facing copy says "Green Collector"

**Green Collector credential:** the only stored credential fact is `profiles.verified_at` (set via service role only — the `profiles_guard` trigger rejects end-user writes to it). Everything else derives client-side in [src/lib/collectorCred.js](src/lib/collectorCred.js) from live requests: pickups completed (`paid` jobs), rating (avg poster `rating` over those), and tier (`Verified`; `Top-Rated` at ≥20 paid pickups and rating ≥4.8; `Certified`/`Team Lead`/`Barangay Coordinator` render as locked "coming" rungs). `App.jsx` exposes `credentialFor(userId)`, consumed by [CollectorCredential.jsx](src/components/CollectorCredential.jsx) (the tappable trust line posters see in TrashCard and the MessageThread header) and [CredentialSheet.jsx](src/components/CredentialSheet.jsx) (the Green Collector ID card: stats, career ladder, certification guide; also behind ProfileView's "My Green Collector ID" row).

It is also an **installable PWA** (`vite-plugin-pwa` in [vite.config.js](vite.config.js): manifest, icons in `public/pwa-*.png`, auto-updating service worker that precaches only the built shell — Supabase traffic is never cached). Signed-out visitors get a full-width marketing **landing page** ([src/components/Landing.jsx](src/components/Landing.jsx)) with live impact stats read anonymously; its CTAs lead into `AuthScreen`, and `Landing` lifts the 430px shell cap via `data-page="landing"` on `<html>` while mounted. Leaflet-bearing components (`LocationPicker`, `CollectorTracker`) are lazy-loaded so maps ship in their own chunk.

## Environment

The Supabase client ([src/lib/supabase.js](src/lib/supabase.js)) is built from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Without a `.env` the app cannot authenticate or read data. Privileged scripts read additional secrets from the environment (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`) and must only run locally. `.env`, `backups/`, and `supabase/.temp/` are gitignored.

## Architecture

**`App.jsx` owns session/role state and every mutator; reads come from realtime hooks.** [App.jsx](src/App.jsx) holds `currentUser`, `profiles`, `role`, and `appState`, and defines every write — `addRequest`, `updateStatus`, `handleAfterPhoto`, `handleLike`, `handleRate`, `addPost`, `handlePostLike`. **Mutators do not setState directly**: they write to Supabase, and the UI updates when the matching realtime subscription echoes the change back. When adding behavior that touches request/post data, add the Supabase write in `App.jsx`, thread it through props, and make sure the relevant hook subscribes to the table so the change round-trips.

**App flow is a three-state machine** in `App.jsx` (`appState`): `'loading'` → `'auth'` → `'app'`, rendering `LoadingScreen`, `AuthScreen`, or the main UI. On `LoadingScreen` finish, `handleLoadingDone` checks `supabase.auth.getSession()` and skips straight to `'app'` if a session exists. Within the app, `view` (`'home'` | `'community'` | `'leaderboard'` | `'you'`) selects `HomeFeed`, `FeedView`, `LeaderboardView`, or `ProfileView`; `BottomNav` switches views, and its raised center button opens the `Conversations` inbox → `MessageThread` overlay (which hosts per-request chat, the pickup journey rail, after-photo review, and payment/rating actions). Auth is real — `AuthScreen` uses `supabase.auth.signInWithPassword` / `signUp` (sign-up stores `name` in user metadata and may require email confirmation). An idle-logout hook signs users out after 10 minutes of inactivity. `ProfileView` hosts three settings sheets: [AccountSheet.jsx](src/components/AccountSheet.jsx) (avatar upload to the `avatars` bucket, display name, email/password via `supabase.auth.updateUser`), [NotificationsSheet.jsx](src/components/NotificationsSheet.jsx) (toggles persisted in `profiles.notification_prefs`), and [GuidelinesSheet.jsx](src/components/GuidelinesSheet.jsx) (static community guidelines). The prefs gate in-app alert toasts fired from `App.jsx`'s `app-alerts` realtime channel: request status transitions moved by the other party, new messages (RLS-scoped table-wide subscription), and new community posts.

**Realtime is the sync mechanism** (it replaced the old BroadcastChannel/localStorage prototype). State is read through hooks that fetch once and then subscribe to Postgres changes:
- [useRequests](src/hooks/useRequests.js) — `requests` (+ joined `request_likes`); subscribes to `requests` INSERT/UPDATE and `request_likes` INSERT/DELETE. Also returns a connection status so `App` can show a "reconnecting" toast on `CHANNEL_ERROR`/`TIMED_OUT`.
- [useFeed](src/hooks/useFeed.js) — `posts` (+ `post_likes`), same pattern.
- [MessageThread](src/components/MessageThread.jsx) and [CollectorTracker](src/components/CollectorTracker.jsx) — open per-request channels filtered by `request_id` for `messages` and `collector_locations`.

Each hook has a `dbToApp(row)` that maps DB `snake_case` columns to the app's `camelCase` shape — that mapping is the canonical place to add/rename a field.

**Request lifecycle** is driven by the `status` field: `open` → `accepted` (Collector takes the job; sets `collected_by`) → `collected` (Collector uploads an after-photo to Storage; `after_photo_url` set to the public URL) → `payment_sent` (Poster accepts the proof and reports paying via the [PaymentSheet](src/components/PaymentSheet.jsx) pay sheet — method/reference/`payment_sent_at`) → `paid` (Collector confirms receipt; `payment_confirmed_at`). Branches: `disputed` (Poster rejects the proof; after-photo cleared, collector re-uploads) and the collector's "Haven't received it?" escape hatch (`payment_sent` → back to `collected` with payment fields cleared). Money moves outside the app (GCash/Maya/cash); the app records the dual-confirmation handshake. The review/payment/rating actions live in [MessageThread.jsx](src/components/MessageThread.jsx). [StatusBadge.jsx](src/components/StatusBadge.jsx) maps status values and trash-type categories to colors/labels; [lib/tagColors.js](src/lib/tagColors.js) is the canonical tag→color map (`Biodegradable`/`Recyclable`/`Residual`/`Mixed`), theme-aware via per-theme CSS variables. [TrashCard.jsx](src/components/TrashCard.jsx) renders the right action buttons per `status` + viewer-role combination.

**Live tracking:** while a job is `accepted`, [MessageThread](src/components/MessageThread.jsx) (collector side) reads `navigator.geolocation` and upserts into `collector_locations`; the poster's [CollectorTracker](src/components/CollectorTracker.jsx) subscribes to that row and uses [utils/haversine.js](src/utils/haversine.js) to turn distance into a proximity label ("Green Collector on the way / nearby / arrived") over a Leaflet map.

## Data model (Supabase `public` schema)

All tables have RLS enabled. Be aware of scoping when testing — e.g. `messages` and `collector_locations` are only visible to a request's poster/collector.

- `profiles` — one row per auth user: `id` (FK → `auth.users`), `name`, `default_role` (deprecated, nullable), `avatar_url`, `gcash_number`/`maya_number` (collector's receiving details, world-readable by design — posters need them to pay), `verified_at` (Green Collector verification; world-readable, writable only by service role — enforced by the `profiles_guard` trigger), `notification_prefs` (jsonb `{jobUpdates, messages, community}` gating the in-app alert toasts; defaults/merging in [src/lib/notificationPrefs.js](src/lib/notificationPrefs.js)).
- `requests` — `poster_id`, `photo_url`, `location_lat/lng/label/geohash`, `tags` (text[]), `price`, `status` (`open|accepted|collected|disputed|payment_sent|paid`), `after_photo_url`, `collected_by`, `rating`/`collector_rating` (1–5, two-sided), and the payment handshake: `payment_method` (`gcash|maya|cash`), `payment_reference`, `payment_sent_at`, `payment_confirmed_at`. A `requests_guard` trigger enforces that only the poster edits offer/payment-sent fields (a non-poster may only clear them — the "not received" escape hatch) and only the collector sets `payment_confirmed_at`.
- `request_likes` — (`request_id`, `user_id`) composite PK.
- `posts` — community feed: `author_id`, `type` (`event|news|post`), `title`, `body`, `photo_url`, `event_date`, `event_location`, `external_url`.
- `post_likes` — (`post_id`, `user_id`) composite PK.
- `messages` — per-request chat: `request_id`, `sender_id`, `text`, `sent_at`.
- `collector_locations` — `collector_id` (PK), `request_id`, `lat`, `lng`, `updated_at`.

**Storage buckets:** `trash-photos` (request before-photos), `after-photos` (cleanup proof), `post-photos` (community images), `avatars` (profile photos; users may only write inside their own `{uid}/` folder). Uploads are guarded client-side by [lib/validateImage.js](src/lib/validateImage.js) (JPEG/PNG, ≤5 MB) and served as public URLs.

## Auth emails

Confirmation and password-recovery emails use the branded templates in [email-templates/](email-templates/), pushed to the project with `node scripts/apply-email-templates.mjs` (needs `SUPABASE_ACCESS_TOKEN`). Supabase only allows template customization with a custom SMTP provider (Resend) configured in the dashboard.

## Deployment

Hosted on Vercel ([vercel.json](vercel.json)): build to `dist/` with an SPA rewrite serving `index.html` for all routes. Set `VITE_SUPABASE_*` as environment variables in the hosting dashboard.

## Styling

Tailwind v4 is compiled through `@tailwindcss/vite` (configured in [vite.config.js](vite.config.js)); fonts (`DM Sans` body, `Fraunces` display) are declared in the `@theme` block of [src/index.css](src/index.css).

**Every color goes through a design token.** `src/index.css` defines the token set (`--surface`, `--surface-card`, `--text-primary/-secondary/-muted`, `--border`, `--brand`, `--on-brand`, `--brand-ink`, `--accent`, `--success/--warning/--danger`, `--radius-*`, `--shadow-*`, per-tag chip vars) with Fresh Canopy defaults for first paint; [src/lib/themes.js](src/lib/themes.js) rewrites all of them on `<html>` when switching themes (`fresh-canopy` light default, `bold-impact` dark). Dark themes set `data-dark` on `<html>` — used by the Leaflet tile-invert rule in `index.css`. **Never hardcode hex in components** (exceptions: overlays on photos and Leaflet popup internals, which are theme-independent).

Shared primitives live in [src/components/ui/](src/components/ui/) — `Button`, `Card`, `Chip`, `Input`/`TextArea`, `Sheet` (the app's single modal idiom), `EmptyState`, `Avatar`. Interactive states that inline styles can't express (`:focus` rings, press feedback, sheet/skeleton/pop animations) are the `.tt-*` classes in `index.css`, all reduced-motion aware.

**Visual verification without a backend:** the dev server serves `/preview.html` ([src/dev/preview.jsx](src/dev/preview.jsx)), which renders shell/screens with fixture data — `?screen=shell|cards|sheet|feed|profile|board|inbox|pay|confirmpay|thread|credential|settings|notifprefs|guidelines&theme=fresh-canopy|bold-impact`. It is not part of the production build. Maps use Leaflet / react-leaflet with imported marker assets.
