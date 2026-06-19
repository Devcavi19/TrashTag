# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server with HMR
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run lint` — run ESLint over the repo

There is no test runner configured. `playwright` is installed as a devDependency but no test suite exists yet.

## What this is

TrashTag is a mobile-first (430px max-width) React 19 + Vite single-page app: a two-sided marketplace where **Posters** create trash-pickup requests and **Collectors** accept and fulfill them. It is a front-end-only prototype — there is no backend; all data lives in browser state, `localStorage`, and mock data files.

## Architecture

**`App.jsx` is the single source of truth.** It holds all `requests` state and every mutator (`addRequest`, `updateStatus`, `handleAfterPhoto`, `handleLike`, `handleRate`), passing them down as props. There is no global store, context, or router — components are presentational and receive callbacks. When adding behavior that touches request data, add the mutator in `App.jsx` and thread it through props.

**App flow is a three-state machine** in `App.jsx` (`appState`): `'loading'` → `'auth'` → `'app'`, rendering `LoadingScreen`, `AuthScreen`, or the main UI respectively. Within the app, `role` (`'poster'` | `'collector'`) toggles between `PosterView` and `CollectorView`; `TopBar` switches the role. Auth is mock-only — `AuthScreen` validates against `src/data/users.js` credentials.

**Cross-tab sync is the key mechanism.** `requests` state comes from `useSharedRequests` (`src/hooks/useSharedRequests.js`), a drop-in `useState` replacement that persists to `localStorage` (key `trashtag:requests`) and broadcasts every change over a `BroadcastChannel` (`trashtag`). This lets you open two tabs — one as Poster, one as Collector — and see updates propagate live. Incoming broadcasts are applied without re-broadcasting to avoid loops. Note: this only syncs between windows of the same type (normal vs. private browsing are isolated).

**Request lifecycle** is driven by the `status` field, advancing through: `open` → `accepted` (Collector takes the job; sets `collectedBy`) → `collected` (Collector uploads an after-photo via `FileReader` → data URL) → `paid` (Poster confirms payment). `StatusBadge.jsx` maps both status values and trash-type categories (`Biodegradable`/`Recyclable`/`Residual`) to colors/labels — it's the canonical place for those mappings. `TrashCard.jsx` renders the right action buttons per `status` + `viewerRole` combination.

**A request object's shape** (see `src/data/sampleRequest.js`): `{ id, photo, gps, type, price, status, postedAt, rating, afterPhoto, likes: [], collectedBy, postedBy }`. Photos (`photo`, `afterPhoto`) are base64 data URLs from file inputs, not uploaded files. `price` is auto-derived from trash `type` (Biodegradable=20, Recyclable=30, Residual=50). `likes` is an array of user IDs; `Leaderboard.jsx` ranks collectors by completed (`paid`) jobs.

## Styling

Tailwind is loaded via CDN `<script>` in `index.html` (no PostCSS/Tailwind build step), with a custom `DM Sans` font config inlined there. Components mix Tailwind utility classes with extensive inline `style={{}}` objects for the specific color palette (e.g. `#f3f4f2` background, category colors). Global resets and the 430px centered shell live in `src/index.css`.
