# TrashTag — Design System & Visual Redesign (Phase 1)

**Date:** 2026-07-04
**Status:** Approved design, pending implementation plan

## Context

TrashTag is being upgraded from a working prototype into a polished, production-ready
product. The overall effort was decomposed into three phases, each with its own
spec → plan → implementation cycle:

1. **Phase 1 (this spec):** design tokens + full visual redesign
2. **Phase 2:** payment flow with dual confirmation (decisions recorded in Roadmap below)
3. **Phase 3:** public landing page, installable PWA, production polish

Decisions made during brainstorming (2026-07-04):

- **Visual direction:** "Fresh Canopy" — airy off-white surfaces, deep forest ink,
  one vivid green, rounded cards, soft shadows. "Bold Impact" (dark forest surfaces,
  electric lime, sharper corners) ships as a second selectable theme. Fresh Canopy
  is the default.
- **Redesign depth:** full visual redesign of every screen; flows, props, data
  layer, and `App.jsx` state machine stay unchanged.
- **Payments (Phase 2):** dual confirmation, money moves outside the app
  (GCash / Maya / cash), dedicated bottom-sheet flow.
- **Mobile app (Phase 3):** installable PWA, not a native wrapper.
- **Website (Phase 3):** public marketing landing page for logged-out visitors.
- **Build order:** design-system-first, so Phase 2's payment sheet is built once,
  on the new components.

## Phase 1 Scope

### 1. Design tokens

Replace the 3-variable theme system (`--brand`, `--brand-accent`, `--app-bg`) in
`src/lib/themes.js` with a full token set applied as CSS variables on `:root`:

| Token | Purpose |
| --- | --- |
| `--surface` | page background |
| `--surface-card` | card background |
| `--surface-raised` | sheets, menus, elevated elements |
| `--text-primary` / `--text-secondary` / `--text-muted` | text hierarchy |
| `--border` | hairlines, dividers, input borders |
| `--brand` | primary brand color (buttons, active states) |
| `--on-brand` | text/icons rendered on `--brand` |
| `--accent` | secondary highlight |
| `--success` / `--warning` / `--danger` | status colors |
| `--radius-card` / `--radius-control` | corner radii (cards vs buttons/inputs) |
| `--shadow-card` | card elevation |

Components must not hardcode hex colors; every color goes through a token.
`src/index.css` holds the default (Fresh Canopy) values plus global resets.

### 2. Themes

Two complete themes replace the current `forest` / `grab` / `midnight` presets:

- **`fresh-canopy` (default):** `#f7f9f5` surface, white cards, forest-ink text
  (`#173d2b` headings), `#2fa96a` brand green, generous radii, soft shadows.
- **`bold-impact`:** `#101613` surface, `#1a231d` cards, `#eaffe9` text,
  `#a3ff6b` lime brand with dark `--on-brand`, sharper radii, border-based
  elevation instead of shadows.

Theme objects carry a `dark: boolean` flag so consumers (Leaflet map, photo
overlays) can adapt. The `trashtag-theme` localStorage key is kept; stored values
that no longer exist fall back to the default. The Appearance picker in
`ProfileView` lists the new themes with updated swatches.

`src/lib/tagColors.js` (canonical trash-type → color map for
Biodegradable/Recyclable/Residual/Mixed) becomes theme-aware: each tag defines
a light and a dark background/text pair, selected by the active theme's `dark`
flag, so chips stay legible on both themes.

### 3. Tailwind: CDN → Vite plugin

Remove the Tailwind CDN `<script>` from `index.html` and install Tailwind via
`@tailwindcss/vite`. Class names are standard Tailwind and stay unchanged. The
inline DM Sans font config in `index.html` moves into the Tailwind/CSS config.
DM Sans remains the app typeface.

### 4. UI primitives — `src/components/ui/`

Small, single-purpose, token-styled components that all screens compose:

- **`Button`** — primary / secondary / ghost / danger variants, press feedback,
  loading state.
- **`Card`** — surface, radius, shadow from tokens.
- **`Chip`** — tags, filters, status pills.
- **`Input` / `TextArea`** — focus ring, error state, label support.
- **`Sheet`** — bottom sheet with slide-up animation and scrim; becomes the
  app's single modal idiom and the base for Phase 2's payment sheets.
- **`EmptyState`** — icon, one-liner, optional action button.
- **`Avatar`** — initials fallback, sizes.

### 5. Screen redesign (re-skin only)

Every screen migrates to the primitives and tokens, keeping flows/props/data
identical:

- **AuthScreen** — brand hero (logo, tagline) above a clean form card; input
  focus/validation states.
- **TopBar + BottomNav** — `--surface-raised` bar with wordmark and avatar; bottom nav
  with floating center "+" action button; token-driven active states.
- **HomeFeed / TrashCard** — photo-header card: status pill overlay, price tag,
  trash-type chips, distance line, single clear action button per
  status × role; filter chip row under the top bar.
- **PosterView / CollectorView / FeedView / PostCard / ProfileView /
  LeaderboardView / Conversations / MessageThread** — same token/primitive
  treatment with a consistent spacing scale.
- **ComposerModal / ConfirmModal / SuccessModal** — migrate onto `Sheet`.
- **LoadingScreen, loading & empty states** — skeleton cards while hooks fetch;
  designed `EmptyState` for every empty list.
- **Micro-interactions** — CSS-only: button/card press feedback, sheet slide-up,
  like-button pop, status transitions. No animation library.

### Explicitly out of scope for Phase 1

- `App.jsx` session/role state machine, all mutators, hooks, realtime
  subscriptions, RLS, and the Supabase schema — untouched.
- Payment flow (Phase 2), landing page / PWA / service worker (Phase 3).
- New user-facing features of any kind: this phase changes how things look,
  not what they do.

## Error handling

Unchanged in substance (this is a re-skin), but surfaced better: existing error
paths (auth failures, realtime reconnecting toast, image validation rejections)
render through the new components; skeletons and empty states replace blank
regions so failure/loading modes are visibly distinct.

## Verification

No test runner exists; verification is behavioral:

1. **Re-skin invariant:** after each screen group, drive the real app via
   browser automation with the two seeded test accounts and exercise the full
   request lifecycle (post → accept → after-photo → paid) plus feed, chat, and
   profile — confirming identical Supabase writes and realtime behavior.
2. **Both themes, every screen:** check each redesigned screen in `fresh-canopy`
   and `bold-impact`; dark-theme legibility (chips, status colors, map, photos)
   is the known risk area.
3. **Static checks:** `npm run lint` and `npm run build` pass throughout.
4. **User checkpoints:** screenshots after each major screen group for early
   course correction.

## Roadmap record (Phases 2–3 — decided, to be spec'd in their own cycles)

### Phase 2 — Payments (dual confirmation, off-app money movement)

- Request lifecycle gains a step: `open → accepted → collected →
  payment_sent → paid`.
- `requests` gains `payment_method` (`gcash|maya|cash`), `payment_reference`
  (nullable), `payment_sent_at`, `payment_confirmed_at`.
- `profiles` gains collector payment details (e.g. GCash/Maya number) so the
  poster knows where to send money.
- UI: dedicated bottom-sheet flow on the `Sheet` primitive — poster's pay sheet
  (amount, collector's payment details, method picker, optional reference) →
  "I've sent the payment"; collector's confirm sheet → "Confirm received", with
  a "Haven't received it?" escape hatch; receipt-style summary for both, then
  the existing rating prompt.
- Requires an RLS-safe migration; mutators added in `App.jsx` per the existing
  pattern (write to Supabase, realtime echoes back).

### Phase 3 — Website & PWA

- Public landing page at the root for logged-out visitors: hero pitch,
  how-it-works for both roles, impact stats, screenshots, sign-up/log-in CTAs;
  the app stays behind auth.
- Installable PWA: manifest, icons, service worker, offline shell.
- Remaining production polish identified during Phases 1–2.
