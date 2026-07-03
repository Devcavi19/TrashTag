# Implementation Plan — Design System & Visual Redesign (Phase 1)

Spec: [2026-07-04-design-system-redesign-design.md](../specs/2026-07-04-design-system-redesign-design.md)

Each step ends green: `npm run lint` and `npm run build` pass, and the app
still works in the browser. Screens are re-skinned in groups with screenshot
checkpoints for the user after steps 5, 6, and 7.

## Step 0 — Tailwind CDN → Vite plugin

- `npm i -D tailwindcss @tailwindcss/vite`
- Add the plugin to `vite.config.js`; add `@import "tailwindcss"` to `src/index.css`
- Move the inline `tailwind.config` (DM Sans as `font-sans`, Fraunces as
  `font-display`) into CSS `@theme` config; delete the CDN `<script>` tags from
  `index.html`
- Verify: dev server renders identically; build output contains compiled CSS

## Step 1 — Tokens + themes

- `src/index.css`: replace the 3 `:root` variables with the full token set
  (Fresh Canopy values) — first paint correct before JS
- `src/lib/themes.js`: rewrite `THEMES` to `fresh-canopy` (default) +
  `bold-impact`, each setting every token and a `dark` flag; keep storage
  key + fallback behavior; `applyTheme` sets all tokens and toggles a
  `data-dark` attribute on `<html>`
- `src/lib/tagColors.js`: per-tag light/dark bg+text pairs; export a helper
  that resolves against the active theme's `dark` flag
- Update the Appearance picker in `ProfileView` for the new theme list/swatches
- Verify: theme switch re-skins live, persists, old stored ids fall back

## Step 2 — UI primitives (`src/components/ui/`)

`Button`, `Card`, `Chip`, `Input`/`TextArea`, `Sheet`, `EmptyState`, `Avatar` —
all token-styled, no hardcoded hex. `Sheet` gets scrim + slide-up animation
(CSS only) and becomes the modal base.

## Step 3 — App shell

`TopBar`, `BottomNav` (floating center "+"), `LoadingScreen` (skeleton style),
`Toast`. `#root` shell styles in `index.css` move to tokens.

## Step 4 — AuthScreen

Brand hero + form card on `Input`/`Button`; inline validation styling; both themes.

## Step 5 — Requests surface ✅ screenshot checkpoint

`HomeFeed` (filter chips), `TrashCard` (photo-header card: status pill overlay,
price tag, tag chips, distance, per-status action), `PosterView`,
`CollectorView`, `StatusBadge`, `ConfirmModal`/`SuccessModal`/`ComposerModal`
onto `Sheet`, `LocationPicker`, `MapView` dark-tile handling.

## Step 6 — Community + posting ✅ screenshot checkpoint

`FeedView`, `PostCard`, `CreatePostForm`, `PostForm`.

## Step 7 — Profile, leaderboard, chat, tracking ✅ screenshot checkpoint

`ProfileView`, `LeaderboardView`, `Conversations`, `MessageThread`,
`CollectorTracker`.

## Step 8 — States & micro-interactions sweep

Skeletons for every fetch, `EmptyState` for every empty list, press feedback,
like-pop, transitions. Kill any remaining hardcoded hex (`grep -rn '#[0-9a-f]'`).

## Step 9 — Final verification

- `npm run lint`, `npm run build`
- Browser-drive the full lifecycle with both test accounts (post → accept →
  after-photo → paid; feed post + like; chat) on **both themes**
- Confirm identical Supabase writes (re-skin invariant)

## Rules

- No changes to `App.jsx` state machine, mutators, hooks, schema, or RLS
- Any non-reskin discovery gets parked in the spec roadmap, not fixed inline
