# TrashTag ♻️

A mobile-first, two-sided marketplace for trash pickup. **Posters** photograph and post trash-pickup requests; **Collectors** find nearby jobs, clean up, and upload proof; a shared **Community** feed surfaces events and news. Everything syncs live across devices.

Built with **React 19** + **Vite**, styled with **Tailwind CSS** (via CDN), with maps from **Leaflet / react-leaflet** and a full **Supabase** backend (Postgres, Auth, Storage, Realtime). Designed for a 430px max-width mobile viewport.

## Features

- **Three modes, one app** — switch between **Post**, **Collect**, and **Community** from the top bar.
- **Real authentication** — email/password sign-up and login via Supabase Auth, with email confirmation and password recovery (branded HTML emails).
- **Request lifecycle** — `open` → `accepted` → `collected` → `paid`, with the right action buttons surfaced per status and role.
- **Photo uploads** — before/after photos and post images upload to Supabase Storage (JPEG/PNG, ≤5 MB) and are served as public URLs.
- **Maps & location** — pick a request location on a map (reverse-geocoded label + geohash), and browse open jobs on a map.
- **Live collector tracking** — once a job is accepted, the collector's location streams in real time; the poster sees a proximity status ("on the way" → "nearby" → "arrived") and a live map.
- **In-app chat** — poster and collector message each other per request, in real time.
- **Auto-priced by trash type** — Biodegradable (₱20), Recyclable (₱30), Residual (₱50).
- **Likes, ratings & leaderboard** — like requests and community posts, rate completed jobs, and rank collectors by completed work.
- **Realtime everywhere** — requests, feed, chat, and tracking all update instantly via Supabase Realtime (Postgres change subscriptions). Open two devices and watch updates propagate.

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier is fine)

### Configure environment

Copy `.env.example` to `.env` and fill in your project's values (Supabase Dashboard → Project Settings → API):

```bash
cp .env.example .env
```

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

These are read by [src/lib/supabase.js](src/lib/supabase.js) to create the browser client. In Vercel/Netlify, set them as environment variables in the hosting dashboard — never commit real values.

### Install & run

```bash
npm install
npm run dev      # start the Vite dev server with HMR
```

Then open the printed local URL and **sign up** for an account on the auth screen (or log in if you already have one).

### Other scripts

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint over the repo
npm run db:backup  # export all table data to a timestamped SQL file in backups/
```

> There is no test runner configured. `playwright` is installed as a devDependency, but no test suite exists yet. Standalone Node scripts in `scripts/verify-*.mjs` smoke-test realtime sync against a live project.

## Backend (Supabase)

The app talks directly to Supabase from the browser using the anon key; **Row-Level Security (RLS) is enabled on every table** and is the real authorization boundary.

### Tables (`public` schema)

| Table                 | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `profiles`            | One row per auth user — `name`, `default_role` (`poster`/`collector`), avatar. |
| `requests`            | Trash-pickup requests: photo, location (lat/lng/label/geohash), `tags`, `price`, `status`, `rating`, `after_photo_url`, `poster_id`, `collected_by`. |
| `request_likes`       | Join table (`request_id`, `user_id`) of who liked a request.            |
| `posts`               | Community feed entries — `type` is `event`, `news`, or `post`.          |
| `post_likes`          | Join table (`post_id`, `user_id`) of who liked a post.                  |
| `messages`            | Per-request chat (`request_id`, `sender_id`, `text`, `sent_at`).        |
| `collector_locations` | Live collector position per accepted job (`request_id`, `lat`, `lng`).  |

### Storage buckets

- `trash-photos` — request "before" photos
- `after-photos` — proof-of-cleanup photos
- `post-photos` — community post images

### Auth & emails

Sign-up/login use Supabase Auth (email + password). Sign-up stores `name` and `default_role` in user metadata; a new `profiles` row is created on confirmation. Confirmation and password-recovery emails use the branded HTML templates in [email-templates/](email-templates/), applied to the project with `scripts/apply-email-templates.mjs`. Template customization requires a custom SMTP provider (Resend) configured in the Supabase dashboard.

### Deployment

Deployed on **Vercel** ([vercel.json](vercel.json)): `npm run build` → `dist/`, with an SPA rewrite so all routes serve `index.html`.

## How it works

### App flow

[App.jsx](src/App.jsx) drives a three-state machine via `appState`:

```
loading  →  auth  →  app
(LoadingScreen) (AuthScreen) (PosterView | CollectorView | FeedView)
```

On load it checks for an existing Supabase session; if found, it fetches the user's profile and goes straight to the app. Once in the app, `role` (`'poster'` | `'collector'` | `'community'`) chooses which view renders; `TopBar` switches the role.

### Single source of truth

`App.jsx` holds the high-level state (current user, profiles, role) and every **mutator** — `addRequest`, `updateStatus`, `handleAfterPhoto`, `handleLike`, `handleRate`, `addPost`, `handlePostLike`. Each mutator writes to Supabase; the UI updates when the corresponding **realtime subscription** echoes the change back. Read state comes from hooks, not props-drilled state.

### Realtime hooks

- [useRequests](src/hooks/useRequests.js) — fetches all requests (+ likes) once, then subscribes to `INSERT`/`UPDATE` on `requests` and `INSERT`/`DELETE` on `request_likes`, keeping the list live. It also surfaces a connection status so `App` can show a "reconnecting" toast.
- [useFeed](src/hooks/useFeed.js) — same pattern for `posts` and `post_likes`.
- [ChatDrawer](src/components/ChatDrawer.jsx) and [CollectorTracker](src/components/CollectorTracker.jsx) each open their own per-request channel for `messages` and `collector_locations`.

Each hook maps DB rows (`snake_case`) to the app's `camelCase` shape in a `dbToApp` function.

### Request lifecycle

The `status` field advances through:

| Status      | Set when…                                                       |
| ----------- | --------------------------------------------------------------- |
| `open`      | Poster creates the request                                      |
| `accepted`  | Collector takes the job (sets `collected_by`)                   |
| `collected` | Collector uploads an after-photo (Supabase Storage → public URL) |
| `paid`      | Poster confirms payment                                         |

[StatusBadge.jsx](src/components/StatusBadge.jsx) maps both status values and trash categories to colors/labels; [lib/tagColors.js](src/lib/tagColors.js) is the canonical tag→color map. [TrashCard.jsx](src/components/TrashCard.jsx) renders the correct action buttons for each `status` + viewer-role combination.

### Live tracking

While a collector has an active job, [CollectorView](src/components/CollectorView.jsx) polls `navigator.geolocation` and upserts into `collector_locations`. The poster's [CollectorTracker](src/components/CollectorTracker.jsx) subscribes to that row and uses [utils/haversine.js](src/utils/haversine.js) to convert distance into a friendly proximity label and a live Leaflet map.

## Project structure

```
src/
├── App.jsx                  # session/role state + Supabase mutators + app-state machine
├── main.jsx                 # React entry point
├── index.css                # global resets + 430px centered shell
├── lib/
│   ├── supabase.js          # createClient from VITE_SUPABASE_* env vars
│   ├── tagColors.js         # canonical tag → color/label map
│   └── validateImage.js     # client-side upload guard (JPEG/PNG, ≤5 MB)
├── hooks/
│   ├── useRequests.js       # requests + request_likes, fetch + realtime
│   └── useFeed.js           # posts + post_likes, fetch + realtime
├── utils/
│   └── haversine.js         # distance + proximity labels for tracking
└── components/
    ├── AuthScreen.jsx        # Supabase email/password login + signup + confirm
    ├── LoadingScreen.jsx     # splash; checks for existing session on finish
    ├── TopBar.jsx            # header + Post/Collect/Community toggle + logout
    ├── PosterView.jsx        # Poster home (create + manage own requests)
    ├── CollectorView.jsx     # Collector home (browse/accept jobs, stream location)
    ├── FeedView.jsx          # Community feed
    ├── PostForm.jsx          # create a trash request
    ├── CreatePostForm.jsx    # create a community post
    ├── PostCard.jsx          # community feed card
    ├── TrashCard.jsx         # request card + per-status action buttons
    ├── StatusBadge.jsx       # status & category → color/label mapping
    ├── MapView.jsx           # Leaflet map of requests / collector marker
    ├── LocationPicker.jsx    # tap-to-pin map + geolocation for new requests
    ├── CollectorTracker.jsx  # live collector position + proximity (poster side)
    ├── ChatDrawer.jsx        # realtime per-request chat
    ├── Leaderboard.jsx       # ranks collectors by completed jobs
    ├── ConfirmModal.jsx      # confirmation dialog
    ├── SuccessModal.jsx      # success feedback dialog
    └── Toast.jsx             # transient status/connection messages

scripts/
├── apply-email-templates.mjs # push branded auth emails via the Management API
├── db-backup.mjs             # logical data backup (service-role key)
└── verify-*.mjs              # realtime smoke tests (requests / feed / chat)

email-templates/             # confirmation.html, recovery.html
```

## Styling

Tailwind is loaded via a CDN `<script>` in [index.html](index.html) (no PostCSS/Tailwind build step), with a custom `DM Sans` font config inlined there. Components mix Tailwind utility classes with inline `style={{}}` objects for the specific color palette (e.g. `#f3f4f2` background, category colors). Global resets and the 430px centered shell live in [src/index.css](src/index.css).

## Caveats

The browser holds the Supabase anon key, so **RLS policies are the only thing protecting data** — keep them tight. The `db:backup` script and `apply-email-templates` script use privileged keys (service-role / personal access token) and must only run locally with secrets kept out of the repo. `backups/` and `.env` are gitignored.
