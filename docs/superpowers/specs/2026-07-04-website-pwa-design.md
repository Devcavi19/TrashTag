# TrashTag — Public Website & PWA (Phase 3)

**Date:** 2026-07-04
**Status:** Approved design (decisions user-approved in the 2026-07-04
brainstorm; recorded in the Phase 1 spec roadmap), implementing.

## Landing page

Logged-out visitors get a marketing page instead of the bare auth form; the
app stays behind auth exactly as it is.

**Flow:** the `'auth'` app-state gains a substate: `'landing'` (default for
signed-out visitors) → `'form'` (AuthScreen, reached via the landing CTAs,
with a back affordance). Existing session handling is untouched — a returning
session still skips straight to `'app'`.

**Layout:** the app shell caps `#root` at 430px; the landing page breaks out
to full width (a `data-page="landing"` attribute on `<html>` lifts the cap
while it's mounted) and is responsive from phone to desktop. It uses the same
design tokens, so it inherits the active theme.

**Sections:**
1. **Hero** — the thesis: "Trash that pays. Community that cleans." over a
   phone frame rendering a *real* `TrashCard` with fixture data (the product
   is the hero art; no screenshots to go stale). CTAs: "Get started" (signup)
   and "Log in".
2. **How it works** — two tracks side by side: Poster (snap → post a bounty →
   confirm & pay) and Collector (accept nearby → clean & prove → get paid),
   using the dual-confirmation vocabulary from Phase 2.
3. **Live impact** — real numbers read with the anon client (requests are
   world-readable): pickups cleaned, ₱ paid out to collectors, active
   requests. Falls back to em-dashes if the read fails.
4. **Community strip** — one line each for the feed, leaderboard, and live
   tracking, then a closing CTA.
5. **Footer** — wordmark, tagline, "TrashTag PH".

## Installable PWA

- `vite-plugin-pwa` (`registerType: 'autoUpdate'`, workbox precache of the
  build output; Supabase API calls are never cached — realtime data must stay
  live).
- Manifest: name "TrashTag", standalone display, `#173d2b` theme color,
  `#f7f9f5` background, 192/512 icons plus a maskable 512 (brand-ink rounded
  tile with the trash-can mark, generated at build-prep time and committed).
- `index.html` gains `theme-color`, description, Open Graph tags, and
  `apple-touch-icon`.

## Production polish

- **Bundle:** `React.lazy` the Leaflet-bearing components (`MapView`,
  `LocationPicker`, `CollectorTracker` consumers get a skeleton fallback) so
  the ~main bundle drops below the 500 kB warning; landing loads without maps
  entirely.
- No other behavior changes.

## Verification

`npm run lint`/`build` green; production preview checked in a real browser:
manifest reachable, service worker registers, landing renders logged-out
(both themes, phone + desktop widths), CTAs reach both auth tabs, login still
reaches the app, lazy map chunks load on demand (LocationPicker in the
composer).
