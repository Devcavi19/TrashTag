# Dispatch UX Redesign — Eco-Premium (sub-project 1 of the full visual refresh)

**Date:** 2026-07-13 · **Status:** Approved

## Context

The on-demand dispatch system (spec: `2026-07-12-on-demand-dispatch-design.md`) shipped functionally complete but visually additive: the home is the old card feed with a toggle inserted, the radar map has no collector dots and unanchored rings, and the offer takeover escapes the 430px shell. The user wants a major UI/UX change — a full app visual refresh, decomposed into sub-projects:

1. **Design language + the three dispatch surfaces** (this spec)
2. Request lifecycle surfaces (TrashCard, StatusBadge, MessageThread, PaymentSheet, CollectorTracker)
3. Community, leaderboard, profile + settings sheets
4. Landing + auth

**Locked decisions** (brainstormed with visual companion, 2026-07-13):
- Design language: **Eco-Premium** — forest-ink map world, cream sheets, Fraunces serif doing real work, gold money accent, glowing mint collector dots.
- Home structure: **full-bleed map + draggable bottom sheet** (Grab-style; map is the home).
- **Single theme for now**: only `eco-premium` ships; the theme-switcher mechanism stays but the picker is hidden. A night variant is a later, cheap addition because everything stays token-driven.
- Incoming offer: **~25s countdown ring, then minimize** into the sheet's job list; instant auto-dismiss if another collector wins.
- All dispatch/backend logic is untouched: `App.jsx` mutators, hooks, RLS, push, migrations stay as-is. This is a presentation-layer rebuild.

## Design language & tokens

All colors go through the existing CSS-variable token system (`src/index.css` defaults + `src/lib/themes.js`); components never hardcode hex (existing exceptions stand: photo overlays, Leaflet popup internals).

**Palette (single `eco-premium` theme):**

| Token | Value | Use |
|---|---|---|
| `--surface` | `#f4efe6` | cream app/sheet background |
| `--surface-card` | `#fffdf7` | cards on cream |
| `--surface-ink` | `#0e2016` | map chrome: top bar, bottom nav, floating pills *(new)* |
| `--border` | `#e3dccb` | hairlines on cream |
| `--border-ink` | `#2a5238` | hairlines on ink *(new)* |
| `--text-primary` | `#12291c` | ink text |
| `--text-secondary` | `#5d6b60` | |
| `--text-muted` | `#8a8371` | |
| `--text-on-ink` | `#f4efe6` | text on `--surface-ink` *(new)* |
| `--text-on-ink-muted` | `#9db8a6` | *(new)* |
| `--brand` | `#1f5136` | primary buttons, brand marks |
| `--on-brand` | `#f4efe6` | |
| `--brand-ink` | `#12291c` | |
| `--accent` | `#e9c46a` | **gold — reserved for money and "live" signals**: prices, online-toggle knob, countdown ring, radar pin, nav center button |
| `--on-accent` | `#12291c` | *(new)* |
| `--live-dot` | `#7dd6a0` | online-collector dots (glow) *(new)* |
| `--success` / `--warning` / `--danger` | `#2a7a4b` / `#c98a1b` / `#b3423a` | retuned semantics |

Tag chip variables (`Biodegradable`/`Recyclable`/`Residual`/`Mixed`) are retuned to warm variants that sit on cream; `lib/tagColors.js` mechanism unchanged. Radii and shadow tokens keep their names, retuned (sheet radius ~22px, warm-tinted soft shadows).

**Type:** Fraunces sets screen titles, section headers, and **every peso amount** (consistent "price coin": ink pill, gold or cream numerals). DM Sans remains body/UI.

**Map styling:** standard OSM tiles rendered dark forest via a CSS filter, extending the existing tile-invert rule in `index.css`. Exact filter values (invert/hue-rotate/saturate/brightness) are tuned during implementation to hit the `#14311f`-family ground with legible road hairlines. No new tile provider or dependency.

**Motion:** new `.tt-*` keyframes — bottom-sheet spring, radar ring pulse, countdown ring, dot glow pulse — all with `prefers-reduced-motion` fallbacks (static/fade), matching the existing convention.

**Theme switcher:** `themes.js` exports only `eco-premium`; ProfileView's theme picker row is hidden (code kept). `data-dark` handling: the eco-premium theme sets whatever the map-filter rule needs; Leaflet chrome styling keys off the new tokens, not `data-dark`.

## Screens

### Dispatch Home — new `src/components/DispatchHome.jsx` (replaces `HomeFeed.jsx`)

- **Full-bleed Leaflet map** (lazy chunk, preloaded on app mount; forest-ink skeleton with subtle pulse while loading), centered on viewer location.
- **Open jobs** render as price-coin pins (ink pill, gold ₱ amount). Tapping a pin highlights/scrolls to its JobRow in the sheet.
- **Online collectors** (from `collector_presence`) render as glowing `--live-dot` mint dots.
- **Floating top chrome** (`--surface-ink`): Kolek wordmark bar + avatar, and a "Got trash? Post a pickup" pill → existing `ComposerModal`.
- **Bottom sheet** (new `ui/BottomSheet`) with contents, top to bottom:
  1. **On duty** toggle row (existing `usePresence` wiring; gold knob when online, sub-line "Receiving dispatch pings nearby").
  2. **Jobs nearby** — slim `JobRow`s (photo thumbnail, place label, distance, Fraunces price; tap → expand for Accept / view). Replaces full TrashCards on this screen only.
  3. **My pickups & jobs** — own non-`paid` requests, both roles, with status chips; tap → DispatchRadar for own `open` requests, MessageThread otherwise.
- **BottomNav** restyles to forest ink with gold center chat button (same views/behavior).

### Dispatch Radar — rebuilt `src/components/DispatchRadar.jsx`

Same map, transitioned rather than replaced:
- Camera glides to the pickup pin; **radar rings are anchored to the pin and scaled to the real 5 km broadcast radius** (geographic circles that track zoom), pulsing outward. Collector dots stay live (`useNearbyPresence`).
- Sheet becomes **"Finding your Green Collector"**: honest live count ("4 on duty nearby" / "0 nearby — your request stays posted; collectors get pinged as they come online"), incoming **counter-offer cards** (avatar, `credentialFor` line, Fraunces price, gold Accept via existing `accept_price_offer` RPC, quiet Decline) sliding in via realtime, **Cancel request** at bottom.
- On `accepted` (realtime echo), hand off to `MessageThread` exactly as today.

### Incoming Offer — rebuilt `src/components/IncomingOffer.jsx`

- Takeover **constrained to the 430px shell** (fixes desktop overflow).
- Photo with price coin; poster shown **once** (name, distance, tags) — the poster-credential line is removed (it showed the poster's collector credential to collectors; wrong direction).
- **~25s `CountdownRing` around Accept**; Offer a price / Pass beneath (existing `submitPriceOffer` / localStorage pass behavior).
- On expiry: card minimizes into the sheet's "Jobs nearby" list (job not lost). If the job leaves `open` (someone else won), dismiss instantly.
- Countdown pauses while `document.hidden` so backgrounded collectors don't silently lose offers.

## New/changed components

| File | Change |
|---|---|
| `src/components/DispatchHome.jsx` | new — map-first home |
| `src/components/ui/BottomSheet.jsx` | new primitive — detents peek (~120px) / half (~50%) / full (~88%); pointer-event drag + tap-handle cycling as fallback; the handle is a real `<button>` with an `aria-label` announcing the current detent (persistent surface, not a modal dialog); inner scroll containment; reduced-motion: no spring |
| `src/components/JobRow.jsx` | new — slim job list item |
| `src/components/CountdownRing.jsx` | new — SVG stroke-dashoffset ring, default 25 s, pauses on `visibilitychange`, `onExpire` callback |
| `src/components/DispatchRadar.jsx` | rebuilt on the shared map |
| `src/components/IncomingOffer.jsx` | rebuilt |
| `src/components/BottomNav.jsx` | restyled (ink + gold) |
| `src/components/HomeFeed.jsx` | retired (deleted) |
| `src/index.css`, `src/lib/themes.js` | token overhaul, single theme, new keyframes, map filter |
| `src/dev/preview.jsx` | `dispatchhome`/`radar`/`offer` fixtures rebuilt (fixture map = static styled div, no tiles) |
| `CLAUDE.md` | styling section updated |

**Not touched:** `App.jsx` mutators and realtime wiring, all hooks, `MessageThread`, payment flow, TrashCard/StatusBadge (still used by other views until sub-project 2), schema/RLS/Edge Function, PWA config.

## Edge cases

- **Geolocation denied:** map centers on the user's most recent request location, else a city default; quiet banner to enable location. Go Online stays disabled without permission (it already requires location).
- **Empty map:** no jobs/collectors → sheet shows an empty-state row ("No jobs nearby — you'll get pinged"); the map keeps the screen alive, never a blank void.
- **Realtime drop:** existing `useRequests` connection-status "reconnecting" toast continues to cover it.
- **Reduced motion:** rings, sheet spring, countdown animate as static/fade states.

## Verification

1. `npm run lint` + `npm run build`.
2. `/preview.html?screen=dispatchhome|radar|offer` — screenshot review of the rebuilt fixtures.
3. End-to-end (Herald posts, Carl online in second browser): radar rings + live count; ping → countdown → accept; countdown expiry → minimizes into list; simultaneous accept → one winner + loser toast; counter-offer round trip; cancel while pending; handoff to chat; payment flow untouched.
4. `CLAUDE.md` updated.

## Later phases (out of scope here)

Lifecycle surfaces, community/leaderboard/profile, landing/auth restyles; optional night theme variant; TrashCard retirement decision.
