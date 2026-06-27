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

TrashTag is a mobile-first (430px max-width) React 19 + Vite single-page app: a two-sided marketplace where **Posters** create trash-pickup requests and **Collectors** accept and fulfill them, plus a shared **Community** feed. It is backed by **Supabase** (Postgres, Auth, Storage, Realtime); the browser talks to Supabase directly with the anon key, so **Row-Level Security is the authorization boundary**.

## Environment

The Supabase client ([src/lib/supabase.js](src/lib/supabase.js)) is built from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Without a `.env` the app cannot authenticate or read data. Privileged scripts read additional secrets from the environment (`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`) and must only run locally. `.env`, `backups/`, and `supabase/.temp/` are gitignored.

## Architecture

**`App.jsx` owns session/role state and every mutator; reads come from realtime hooks.** [App.jsx](src/App.jsx) holds `currentUser`, `profiles`, `role`, and `appState`, and defines every write — `addRequest`, `updateStatus`, `handleAfterPhoto`, `handleLike`, `handleRate`, `addPost`, `handlePostLike`. **Mutators do not setState directly**: they write to Supabase, and the UI updates when the matching realtime subscription echoes the change back. When adding behavior that touches request/post data, add the Supabase write in `App.jsx`, thread it through props, and make sure the relevant hook subscribes to the table so the change round-trips.

**App flow is a three-state machine** in `App.jsx` (`appState`): `'loading'` → `'auth'` → `'app'`, rendering `LoadingScreen`, `AuthScreen`, or the main UI. On `LoadingScreen` finish, `handleLoadingDone` checks `supabase.auth.getSession()` and skips straight to `'app'` if a session exists. Within the app, `role` (`'poster'` | `'collector'` | `'community'`) selects `PosterView`, `CollectorView`, or `FeedView`; `TopBar` switches the role. Auth is real — `AuthScreen` uses `supabase.auth.signInWithPassword` / `signUp` (sign-up stores `name` + `default_role` in user metadata and may require email confirmation).

**Realtime is the sync mechanism** (it replaced the old BroadcastChannel/localStorage prototype). State is read through hooks that fetch once and then subscribe to Postgres changes:
- [useRequests](src/hooks/useRequests.js) — `requests` (+ joined `request_likes`); subscribes to `requests` INSERT/UPDATE and `request_likes` INSERT/DELETE. Also returns a connection status so `App` can show a "reconnecting" toast on `CHANNEL_ERROR`/`TIMED_OUT`.
- [useFeed](src/hooks/useFeed.js) — `posts` (+ `post_likes`), same pattern.
- [ChatDrawer](src/components/ChatDrawer.jsx) and [CollectorTracker](src/components/CollectorTracker.jsx) — open per-request channels filtered by `request_id` for `messages` and `collector_locations`.

Each hook has a `dbToApp(row)` that maps DB `snake_case` columns to the app's `camelCase` shape — that mapping is the canonical place to add/rename a field.

**Request lifecycle** is driven by the `status` field: `open` → `accepted` (Collector takes the job; sets `collected_by`) → `collected` (Collector uploads an after-photo to Storage; `after_photo_url` set to the public URL) → `paid` (Poster confirms payment). [StatusBadge.jsx](src/components/StatusBadge.jsx) maps status values and trash-type categories to colors/labels; [lib/tagColors.js](src/lib/tagColors.js) is the canonical tag→color map (`Biodegradable`/`Recyclable`/`Residual`/`Mixed`). [TrashCard.jsx](src/components/TrashCard.jsx) renders the right action buttons per `status` + viewer-role combination.

**Live tracking:** [CollectorView](src/components/CollectorView.jsx) reads `navigator.geolocation` for the active job and upserts into `collector_locations`; the poster's [CollectorTracker](src/components/CollectorTracker.jsx) subscribes to that row and uses [utils/haversine.js](src/utils/haversine.js) to turn distance into a proximity label ("Collector on the way / nearby / arrived") over a Leaflet map.

## Data model (Supabase `public` schema)

All tables have RLS enabled. Be aware of scoping when testing — e.g. `messages` and `collector_locations` are only visible to a request's poster/collector.

- `profiles` — one row per auth user: `id` (FK → `auth.users`), `name`, `default_role` (`poster`|`collector`), `avatar_url`.
- `requests` — `poster_id`, `photo_url`, `location_lat/lng/label/geohash`, `tags` (text[]), `price`, `status` (`open|accepted|collected|paid`), `after_photo_url`, `collected_by`, `rating` (1–5).
- `request_likes` — (`request_id`, `user_id`) composite PK.
- `posts` — community feed: `author_id`, `type` (`event|news|post`), `title`, `body`, `photo_url`, `event_date`, `event_location`, `external_url`.
- `post_likes` — (`post_id`, `user_id`) composite PK.
- `messages` — per-request chat: `request_id`, `sender_id`, `text`, `sent_at`.
- `collector_locations` — `collector_id` (PK), `request_id`, `lat`, `lng`, `updated_at`.

**Storage buckets:** `trash-photos` (request before-photos), `after-photos` (cleanup proof), `post-photos` (community images). Uploads are guarded client-side by [lib/validateImage.js](src/lib/validateImage.js) (JPEG/PNG, ≤5 MB) and served as public URLs.

## Auth emails

Confirmation and password-recovery emails use the branded templates in [email-templates/](email-templates/), pushed to the project with `node scripts/apply-email-templates.mjs` (needs `SUPABASE_ACCESS_TOKEN`). Supabase only allows template customization with a custom SMTP provider (Resend) configured in the dashboard.

## Deployment

Hosted on Vercel ([vercel.json](vercel.json)): build to `dist/` with an SPA rewrite serving `index.html` for all routes. Set `VITE_SUPABASE_*` as environment variables in the hosting dashboard.

## Styling

Tailwind is loaded via CDN `<script>` in `index.html` (no PostCSS/Tailwind build step), with a custom `DM Sans` font config inlined there. Components mix Tailwind utility classes with extensive inline `style={{}}` objects for the specific color palette (e.g. `#f3f4f2` background, category colors). Global resets and the 430px centered shell live in `src/index.css`. Maps use Leaflet / react-leaflet with imported marker assets.
