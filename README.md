# TrashTag ♻️

A mobile-first, two-sided marketplace for trash pickup. **Posters** photograph and post trash-pickup requests; **Collectors** accept jobs, clean up, and upload proof. It's a front-end-only prototype — no backend, all data lives in browser state, `localStorage`, and mock data files.

Built with **React 19** + **Vite**, styled with **Tailwind CSS** (via CDN). Designed for a 430px max-width mobile viewport.

## Features

- **Two roles, one app** — toggle between Poster and Collector views from the top bar.
- **Request lifecycle** — `open` → `accepted` → `collected` → `paid`, with the right action buttons surfaced per status and role.
- **Photo capture** — before/after photos are read from file inputs as base64 data URLs (no upload server).
- **Auto-priced by trash type** — Biodegradable (₱20), Recyclable (₱30), Residual (₱50).
- **Live cross-tab sync** — open two tabs (one Poster, one Collector) and watch updates propagate instantly via `BroadcastChannel` + `localStorage`.
- **Likes & ratings** — Posters can like and rate completed jobs.
- **Leaderboard** — ranks collectors by number of completed (`paid`) jobs.
- **Mock auth** — login screen validates against a small set of seed users.

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Install & run

```bash
npm install
npm run dev      # start the Vite dev server with HMR
```

Then open the printed local URL in your browser.

### Other scripts

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # run ESLint over the repo
```

> There is no test runner configured. `playwright` is installed as a devDependency, but no test suite exists yet.

## Demo accounts

Log in on the auth screen with any of these seed users (from `src/data/users.js`):

| Email           | Password      | Default role |
| --------------- | ------------- | ------------ |
| juan@test.com   | password123   | Poster       |
| maria@test.com  | password123   | Collector    |
| pedro@test.com  | pass456       | Poster       |

**Tip:** to see live sync, open the app in two browser tabs — sign in as a Poster in one and a Collector in the other. (Sync only works between windows of the same browsing type; normal and private windows are isolated.)

## How it works

### App flow

`App.jsx` drives a three-state machine via `appState`:

```
loading  →  auth  →  app
(LoadingScreen) (AuthScreen) (PosterView | CollectorView)
```

Once in the app, `role` (`'poster'` | `'collector'`) toggles which view renders; `TopBar` switches the role.

### Single source of truth

`App.jsx` holds all `requests` state and every mutator — `addRequest`, `updateStatus`, `handleAfterPhoto`, `handleLike`, `handleRate` — and passes them down as props. There is no global store, context, or router; components are presentational. When adding behavior that touches request data, add the mutator in `App.jsx` and thread it through props.

### Request lifecycle

The `status` field advances through:

| Status      | Set when…                                                  |
| ----------- | ---------------------------------------------------------- |
| `open`      | Poster creates the request                                 |
| `accepted`  | Collector takes the job (sets `collectedBy`)               |
| `collected` | Collector uploads an after-photo (`FileReader` → data URL) |
| `paid`      | Poster confirms payment                                    |

`StatusBadge.jsx` is the canonical place mapping both status values and trash categories (Biodegradable / Recyclable / Residual) to colors and labels. `TrashCard.jsx` renders the correct action buttons for each `status` + viewer-role combination.

### Cross-tab sync

`useSharedRequests` (`src/hooks/useSharedRequests.js`) is a drop-in `useState` replacement that:

- persists `requests` to `localStorage` under the key `trashtag:requests`, and
- broadcasts every change over a `BroadcastChannel` named `trashtag`.

Incoming broadcasts are applied without re-broadcasting to avoid loops.

### Request shape

See `src/data/sampleRequest.js`:

```js
{
  id, photo, gps, type, price, status,
  postedAt, rating, afterPhoto,
  likes: [],        // array of user IDs
  collectedBy,      // collector who accepted the job
  postedBy,         // poster who created the request
}
```

Photos (`photo`, `afterPhoto`) are base64 data URLs from file inputs, not uploaded files. `price` is auto-derived from `type`.

## Project structure

```
src/
├── App.jsx                  # single source of truth: state + mutators + app-state machine
├── main.jsx                 # React entry point
├── index.css                # global resets + 430px centered shell
├── components/
│   ├── AuthScreen.jsx        # mock login (validates against users.js)
│   ├── LoadingScreen.jsx     # initial loading state
│   ├── TopBar.jsx            # header + role toggle
│   ├── PosterView.jsx        # Poster home
│   ├── CollectorView.jsx     # Collector home
│   ├── PostForm.jsx          # create a new request
│   ├── TrashCard.jsx         # request card + per-status action buttons
│   ├── StatusBadge.jsx       # status & category → color/label mapping
│   ├── Leaderboard.jsx       # ranks collectors by completed jobs
│   ├── ConfirmModal.jsx      # confirmation dialog
│   └── SuccessModal.jsx      # success feedback dialog
├── hooks/
│   └── useSharedRequests.js  # useState + localStorage + BroadcastChannel sync
└── data/
    ├── users.js              # mock user credentials
    └── sampleRequest.js      # request object shape / seed
```

## Styling

Tailwind is loaded via a CDN `<script>` in `index.html` (no PostCSS/Tailwind build step), with a custom `DM Sans` font config inlined there. Components mix Tailwind utility classes with inline `style={{}}` objects for the specific color palette (e.g. `#f3f4f2` background, category colors). Global resets and the 430px centered shell live in `src/index.css`.

## Caveats

This is a prototype. There is no backend, no real authentication, and no persistence beyond the browser's `localStorage`. Clearing browser data resets everything.
