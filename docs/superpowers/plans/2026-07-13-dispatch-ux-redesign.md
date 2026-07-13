# Dispatch UX Redesign (Eco-Premium) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Kolek's three dispatch surfaces (home, radar, incoming offer) as a map-first Eco-Premium experience per `docs/superpowers/specs/2026-07-13-dispatch-ux-redesign-design.md`, without touching any dispatch/backend logic.

**Architecture:** Presentation-layer only. A new full-bleed `DispatchMap` (Leaflet, lazy chunk) is shared by a new `DispatchHome` (replaces `HomeFeed`) and a rebuilt `DispatchRadar`. A new `ui/BottomSheet` primitive provides the draggable three-detent sheet. All colors move to a single `eco-premium` token set. Data still flows: hooks read (now including a new `useOffers`), `App.jsx` owns every mutator, components are pure so `/preview.html` can render them with fixtures.

**Tech Stack:** React 19 + Vite, Tailwind v4 (utility classes + CSS variables), react-leaflet, Supabase realtime (untouched).

## Global Constraints

- **Never hardcode hex in components** — every color goes through a CSS-variable token (exceptions: photo overlays, Leaflet popup internals). Copy from spec.
- **No dispatch/backend logic changes**: `App.jsx` mutators (`addRequest`, `updateStatus`, `submitPriceOffer`, `acceptPriceOffer`, `declinePriceOffer`, `cancelRequest`), all Supabase writes, hooks' subscription behavior, schema, RLS, Edge Function, PWA config stay as-is.
- **430px shell**: every fixed overlay must be `mx-auto w-full max-w-[430px]`, never full browser width.
- **Reduced motion**: every new animation needs a `prefers-reduced-motion: reduce` fallback in `src/index.css`.
- **No test runner exists.** Verification = `npm run lint` + `npm run build` + screenshots of `/preview.html?screen=…` (dev server + `agent-browser` at viewport 430x900). Fixture data lives in `src/dev/preview.jsx`.
- User-facing copy says "Green Collector"; code identifiers keep `collector`/`poster`.
- Commit after every task with a conventional-commit message ending in `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

**Verification harness used by every task:**

```bash
# once per session, from repo root:
(npm run dev -- --port 5199 > /tmp/vite-plan.log 2>&1 &) && sleep 4
# per screen:
agent-browser open "http://localhost:5199/preview.html?screen=<NAME>" --viewport 430x900 && sleep 2 && agent-browser screenshot <NAME>.png
```

Read the screenshot; compare against the task's "Expected" description.

---

### Task 1: Eco-Premium tokens & single-theme consolidation

**Files:**
- Modify: `src/index.css` (`:root` block lines 11–41, tile-filter rule lines 165–169)
- Modify: `src/lib/themes.js` (replace `THEMES`, `DEFAULT_THEME`)
- Modify: `src/lib/tagColors.js` (retune `TAG_TOKENS.light`)
- Modify: `src/components/ProfileView.jsx` (remove ThemePicker)
- Modify: `src/App.jsx` (remove theme state/props)
- Modify: `src/dev/preview.jsx` (default theme param)

**Interfaces:**
- Produces the token names every later task consumes: `--surface`, `--surface-card`, `--surface-raised`, `--surface-ink`, `--border`, `--border-ink`, `--text-primary/-secondary/-muted`, `--text-on-ink`, `--text-on-ink-muted`, `--brand`, `--on-brand`, `--brand-ink`, `--on-brand-ink`, `--accent`, `--on-accent`, `--live-dot`, `--success/--warning/--danger`, `--radius-card/-control`, `--shadow-card/-raised`.

- [ ] **Step 1: Replace the `:root` token block in `src/index.css`**

Replace lines 11–41 (the whole `:root { … }`) with:

```css
:root {
  --surface: #f4efe6;
  --surface-card: #fffdf7;
  --surface-raised: #fffdf7;
  --surface-ink: #0e2016;

  --text-primary: #12291c;
  --text-secondary: #5d6b60;
  --text-muted: #8a8371;
  --text-on-ink: #f4efe6;
  --text-on-ink-muted: #9db8a6;

  --border: #e3dccb;
  --border-ink: #2a5238;

  --brand: #1f5136;
  --on-brand: #f4efe6;
  --brand-ink: #12291c;
  --on-brand-ink: #f4efe6;
  --accent: #e9c46a;
  --on-accent: #12291c;
  --live-dot: #7dd6a0;

  --success: #2a7a4b;
  --warning: #c98a1b;
  --danger: #b3423a;

  --tag-bio-bg: #e6efdd; --tag-bio-fg: #3d6b2f;
  --tag-rec-bg: #e3ecf3; --tag-rec-fg: #2b6187;
  --tag-res-bg: #f6e3da; --tag-res-fg: #a04b2e;
  --tag-mix-bg: #ece5f3; --tag-mix-fg: #6d51a1;

  --radius-card: 16px;
  --radius-control: 12px;
  --shadow-card: 0 2px 10px rgba(18, 41, 28, 0.08);
  --shadow-raised: 0 10px 34px rgba(18, 41, 28, 0.18);
}
```

Also update the comment above it: the tokens are now "Eco-Premium defaults" (single theme), not "Fresh Canopy".

- [ ] **Step 2: Make the Leaflet tile filter unconditional forest-ink**

In `src/index.css`, replace the dark-theme tile rule (lines 165–169):

```css
/* Dark theme: invert OSM raster tiles so maps match the surface */
html[data-dark] .leaflet-layer,
html[data-dark] .leaflet-control-attribution {
  filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9);
}
```

with an unconditional rule (maps are forest-ink regardless of theme, like photos):

```css
/* Maps are forest-ink regardless of theme (theme-independent, like photos):
   restyle OSM raster tiles toward the Eco-Premium ground. */
.leaflet-layer,
.leaflet-control-attribution {
  filter: invert(1) sepia(0.4) hue-rotate(85deg) saturate(0.75) brightness(0.72) contrast(0.95);
}
```

These filter values are a starting point; Step 7 tunes them by eye against the `#14311f`-family target with legible road hairlines.

- [ ] **Step 3: Collapse `src/lib/themes.js` to the single `eco-premium` theme**

Replace the `THEMES` and `DEFAULT_THEME` exports (keep `applyTheme`, `isDarkTheme`, `getStoredTheme`, `setStoredTheme`, `initTheme`, and the `TAG_TOKENS` import exactly as they are — `getStoredTheme` already falls back to `DEFAULT_THEME` for unknown stored ids, which silently migrates existing users):

```js
export const THEMES = {
  'eco-premium': {
    name: 'Eco-Premium',
    blurb: 'Forest ink, warm cream, gold — the Kolek look',
    dark: false,
    swatch: ['#12291c', '#e9c46a'],
    tokens: {
      '--surface': '#f4efe6',
      '--surface-card': '#fffdf7',
      '--surface-raised': '#fffdf7',
      '--surface-ink': '#0e2016',
      '--text-primary': '#12291c',
      '--text-secondary': '#5d6b60',
      '--text-muted': '#8a8371',
      '--text-on-ink': '#f4efe6',
      '--text-on-ink-muted': '#9db8a6',
      '--border': '#e3dccb',
      '--border-ink': '#2a5238',
      '--brand': '#1f5136',
      '--on-brand': '#f4efe6',
      '--brand-ink': '#12291c',
      '--on-brand-ink': '#f4efe6',
      '--accent': '#e9c46a',
      '--on-accent': '#12291c',
      '--live-dot': '#7dd6a0',
      '--success': '#2a7a4b',
      '--warning': '#c98a1b',
      '--danger': '#b3423a',
      '--radius-card': '16px',
      '--radius-control': '12px',
      '--shadow-card': '0 2px 10px rgba(18, 41, 28, 0.08)',
      '--shadow-raised': '0 10px 34px rgba(18, 41, 28, 0.18)',
    },
  },
}

export const DEFAULT_THEME = 'eco-premium'
```

Update the file-top comment: single theme for now; the mechanism stays so a night variant can return later.

- [ ] **Step 4: Retune `TAG_TOKENS.light` in `src/lib/tagColors.js`**

Replace the `light` object (leave `dark` untouched — unused for now, harmless):

```js
  light: {
    '--tag-bio-bg': '#e6efdd', '--tag-bio-fg': '#3d6b2f',
    '--tag-rec-bg': '#e3ecf3', '--tag-rec-fg': '#2b6187',
    '--tag-res-bg': '#f6e3da', '--tag-res-fg': '#a04b2e',
    '--tag-mix-bg': '#ece5f3', '--tag-mix-fg': '#6d51a1',
  },
```

- [ ] **Step 5: Remove the theme picker from `ProfileView.jsx` and theme plumbing from `App.jsx`**

In `src/components/ProfileView.jsx`:
- Delete the `ThemePicker` function component (the block starting at the comment near line 141, "Theme picker — swatches always show…").
- Delete the `import { THEMES } from '../lib/themes'` line.
- Delete `<ThemePicker current={theme} onChange={onThemeChange} />` and the `{/* Appearance — theme switcher, applies app-wide */}` comment (near line 314).
- Remove `theme, onThemeChange` from the component's props destructuring.

In `src/App.jsx`:
- Delete `const [theme, setTheme] = useState(getStoredTheme)` (line 45).
- Find and delete the `handleThemeChange` function (`grep -n handleThemeChange src/App.jsx`).
- Delete the `theme={theme}` and `onThemeChange={handleThemeChange}` props on `<ProfileView …>` (lines 614–615).
- Delete the now-unused import `import { getStoredTheme, applyTheme, setStoredTheme } from './lib/themes'` (line 9). (`initTheme` is called from `main.jsx`, which keeps its own import.)

In `src/dev/preview.jsx` line 40, change the theme fallback:

```js
applyTheme(params.get('theme') || 'eco-premium')
```

(Git history preserves the ThemePicker; the spec's "code kept" is satisfied by the themes.js mechanism surviving.)

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: passes with no new errors (watch for unused-variable errors from the removals — fix by deleting the leftover reference, not by suppressing).

- [ ] **Step 7: Visual check + tile-filter tuning**

Start the dev server (see harness in Global Constraints) and screenshot:
- `?screen=shell` — cream surfaces, ink text, warm borders; no leftover bright green `#2fa96a`.
- `?screen=cards` — TrashCards on cream; tag chips warm-tinted; primary buttons deep forest with cream text.
- `?screen=thread` — chat + journey rail legible on the new palette.

The tile filter can't be judged here (no map screen yet — Task 3 re-checks it). If `shell`/`cards` show any unreadable pairing (e.g. gold text on cream), adjust the offending token in **both** `index.css` and `themes.js` — they must stay identical.

- [ ] **Step 8: Commit**

```bash
git add src/index.css src/lib/themes.js src/lib/tagColors.js src/components/ProfileView.jsx src/App.jsx src/dev/preview.jsx
git commit -m "feat: eco-premium token set, single theme, forest map tiles"
```

---

### Task 2: `ui/BottomSheet` primitive

**Files:**
- Create: `src/components/ui/BottomSheet.jsx`
- Modify: `src/index.css` (detent transition class)
- Modify: `src/dev/preview.jsx` (new `bottomsheet` screen)

**Interfaces:**
- Produces: `<BottomSheet detent onDetentChange peekHeight bottomOffset>{children}</BottomSheet>` — controlled; `detent` ∈ `'peek' | 'half' | 'full'`; `onDetentChange(nextDetent)` fires on drag-release snap or handle tap; `bottomOffset` px reserved below the sheet (for the nav); children scroll internally. Task 4 consumes this exact API.

- [ ] **Step 1: Add the detent transition class to `src/index.css`**

Next to the existing `.tt-sheet` rules:

```css
/* BottomSheet detent snap */
.tt-sheet-detent {
  transition: height 0.3s cubic-bezier(0.32, 0.72, 0.22, 1);
}
```

and add `.tt-sheet-detent` to the `transition: none`/`animation: none` set inside the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .tt-sheet-detent {
    transition: none;
  }
```

- [ ] **Step 2: Create `src/components/ui/BottomSheet.jsx`**

```jsx
import { useRef, useState } from 'react'

const ORDER = ['peek', 'half', 'full']

// Persistent draggable bottom sheet with three detents. Purely controlled —
// parent owns `detent`. Dragging the handle overrides the height live and
// snaps to the nearest detent on release; a tap on the handle cycles detents.
// Content scrolls internally; only the handle owns the drag gesture, so
// scrolling and dragging never fight.
export default function BottomSheet({
  detent = 'peek',
  onDetentChange,
  peekHeight = 136,
  bottomOffset = 0,
  children,
}) {
  const [dragHeight, setDragHeight] = useState(null)
  const drag = useRef(null)

  const heights = {
    peek: peekHeight,
    half: Math.round(window.innerHeight * 0.5),
    full: Math.round(window.innerHeight * 0.88),
  }

  function snapTo(px) {
    let best = ORDER[0]
    for (const d of ORDER) {
      if (Math.abs(heights[d] - px) < Math.abs(heights[best] - px)) best = d
    }
    return best
  }

  function onPointerDown(e) {
    drag.current = { startY: e.clientY, startH: dragHeight ?? heights[detent], moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!drag.current) return
    const dy = drag.current.startY - e.clientY
    if (Math.abs(dy) > 4) drag.current.moved = true
    setDragHeight(Math.max(heights.peek, Math.min(heights.full, drag.current.startH + dy)))
  }

  function onPointerUp() {
    if (!drag.current) return
    if (drag.current.moved && dragHeight != null) {
      onDetentChange?.(snapTo(dragHeight))
    } else {
      onDetentChange?.(ORDER[(ORDER.indexOf(detent) + 1) % ORDER.length])
    }
    drag.current = null
    setDragHeight(null)
  }

  return (
    <div
      className={`absolute inset-x-0 z-30 flex flex-col ${dragHeight == null ? 'tt-sheet-detent' : ''}`}
      style={{
        bottom: bottomOffset,
        height: dragHeight ?? heights[detent],
        background: 'var(--surface)',
        borderRadius: '22px 22px 0 0',
        boxShadow: 'var(--shadow-raised)',
      }}
    >
      <button
        type="button"
        aria-label={`Sheet at ${detent} height — tap to change`}
        className="flex w-full flex-none cursor-grab justify-center py-3"
        style={{ touchAction: 'none', background: 'transparent' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span aria-hidden className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  )
}
```

- [ ] **Step 3: Add a `bottomsheet` preview screen to `src/dev/preview.jsx`**

Add imports at the top with the other component imports:

```js
import { useState } from 'react'
import BottomSheet from '../components/ui/BottomSheet'
```

(merge `useState` into the existing `react` import line: `import { StrictMode, useState } from 'react'`).

Add a stateful demo component near the other helper components:

```jsx
function BottomSheetDemo() {
  const [detent, setDetent] = useState('half')
  return (
    <div className="fixed inset-0 mx-auto w-full max-w-[430px]" style={{ background: 'var(--surface-ink)' }}>
      <p className="p-4 text-sm" style={{ color: 'var(--text-on-ink-muted)' }}>
        Map placeholder — drag the handle, or tap it to cycle detents. Current: {detent}
      </p>
      <BottomSheet detent={detent} onDetentChange={setDetent} bottomOffset={0}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="mb-2 rounded-[14px] border p-3 text-sm"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
            Row {i + 1} — inner content scrolls when taller than the sheet
          </div>
        ))}
      </BottomSheet>
    </div>
  )
}
```

Register it in the screens map: `bottomsheet: <BottomSheetDemo />`, and add `bottomsheet` to the screens list comment on line 6.

- [ ] **Step 4: Lint + visual check**

Run: `npm run lint` → passes.
Screenshot `?screen=bottomsheet`: cream sheet with rounded top over an ink background, handle pill centered, rows visible. Then drive it: `agent-browser snapshot -i`, click the handle button twice, re-screenshot — sheet height must visibly cycle (half → full → peek).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/BottomSheet.jsx src/index.css src/dev/preview.jsx
git commit -m "feat: BottomSheet ui primitive with three detents"
```

---

### Task 3: `DispatchMap` — shared full-bleed map

**Files:**
- Create: `src/components/DispatchMap.jsx`
- Modify: `src/index.css` (pin/dot/ring styles + keyframes)
- Modify: `src/dev/preview.jsx` (new `dispatchmap` screen)
- Modify: `src/App.jsx` (preload effect)

**Interfaces:**
- Produces: `<DispatchMap center zoom jobs collectors radar selectedJobId onSelectJob follow />` where `center = {lat, lng}` (required), `jobs` = app-shaped requests (`id`, `lat`, `lng`, `price`), `collectors` = `[{collectorId, lat, lng}]` (the `useNearbyPresence` shape), `radar = {lat, lng, radiusMeters} | null`, `onSelectJob(job)`, `follow` glides the camera on center change. Default export, lazy-imported by Tasks 4 and 5 (`lazy(() => import('./DispatchMap'))`).

- [ ] **Step 1: Add map-furniture CSS to `src/index.css`**

After the `.tt-pop` block:

```css
/* Dispatch map furniture */
.tt-price-pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 30px;
  padding: 0 10px;
  background: var(--surface-ink);
  color: var(--accent);
  border: 1.5px solid var(--border-ink);
  border-radius: 999px;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
}
.tt-price-pin-selected {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

@keyframes tt-dot-glow {
  0%, 100% { box-shadow: 0 0 6px 2px color-mix(in srgb, var(--live-dot) 65%, transparent); }
  50% { box-shadow: 0 0 14px 5px color-mix(in srgb, var(--live-dot) 30%, transparent); }
}
.tt-live-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--live-dot);
  border: 2px solid var(--surface-ink);
  animation: tt-dot-glow 2.4s ease-in-out infinite;
}

.tt-radar-pin {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid var(--surface-ink);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 70%, transparent);
}

@keyframes tt-ring-pulse {
  0%, 100% { stroke-opacity: 0.55; }
  50% { stroke-opacity: 0.12; }
}
.tt-radar-ring { animation: tt-ring-pulse 2.6s ease-in-out infinite; }
.tt-radar-ring-1 { animation-delay: 0.5s; }
.tt-radar-ring-2 { animation-delay: 1s; }
```

Extend the reduced-motion block with `.tt-live-dot, .tt-radar-ring { animation: none; }` (keep `stroke-opacity` at rest value — that's what `animation: none` yields).

- [ ] **Step 2: Create `src/components/DispatchMap.jsx`**

```jsx
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Full-bleed dispatch map shared by DispatchHome and DispatchRadar. Lazy-load
// it (lazy(() => import('./DispatchMap'))) so Leaflet stays in its own chunk.
// Pure presentation: everything arrives via props, nothing touches Supabase.

function priceIcon(price, selected) {
  return L.divIcon({
    className: '',
    html: `<div class="tt-price-pin${selected ? ' tt-price-pin-selected' : ''}">₱${price}</div>`,
    iconSize: [60, 32],
    iconAnchor: [30, 16],
  })
}

const liveDotIcon = L.divIcon({
  className: '',
  html: '<div class="tt-live-dot"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const radarPinIcon = L.divIcon({
  className: '',
  html: '<div class="tt-radar-pin"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

// Glides the camera when the target moves (home → radar handoff, live GPS).
function CameraFly({ lat, lng, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { animate: true, duration: 0.8 })
  }, [lat, lng, zoom, map])
  return null
}

const RING_FRACTIONS = [0.33, 0.66, 1]

export default function DispatchMap({
  center,
  zoom = 15,
  jobs = [],
  collectors = [],
  radar = null,
  selectedJobId = null,
  onSelectJob,
  follow = false,
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {jobs
        .filter((j) => j.lat != null && j.lng != null)
        .map((j) => (
          <Marker
            key={j.id}
            position={[j.lat, j.lng]}
            icon={priceIcon(j.price, j.id === selectedJobId)}
            eventHandlers={{ click: () => onSelectJob?.(j) }}
          />
        ))}

      {collectors
        .filter((c) => c.lat != null && c.lng != null)
        .map((c) => (
          <Marker key={c.collectorId} position={[c.lat, c.lng]} icon={liveDotIcon} interactive={false} />
        ))}

      {radar && (
        <>
          <Marker position={[radar.lat, radar.lng]} icon={radarPinIcon} interactive={false} />
          {RING_FRACTIONS.map((f, i) => (
            <Circle
              key={f}
              center={[radar.lat, radar.lng]}
              radius={radar.radiusMeters * f}
              pathOptions={{
                color: 'var(--accent)',
                weight: 2,
                fillOpacity: 0,
                className: `tt-radar-ring tt-radar-ring-${i}`,
              }}
            />
          ))}
        </>
      )}

      {follow && <CameraFly lat={center.lat} lng={center.lng} zoom={zoom} />}
    </MapContainer>
  )
}
```

(No Leaflet default-icon URL fix needed — this component only uses `divIcon`s.)

- [ ] **Step 3: Preload the map chunk from `src/App.jsx`**

Add near the other top-of-component effects in `App()`:

```js
  // The dispatch home needs the map immediately — warm the Leaflet chunk.
  useEffect(() => {
    import('./components/DispatchMap')
  }, [])
```

- [ ] **Step 4: Add a `dispatchmap` preview screen to `src/dev/preview.jsx`**

```js
import DispatchMap from '../components/DispatchMap'
```

Fixture data (near `FIXTURE_REQUESTS`):

```js
const FIXTURE_CENTER = { lat: 10.3157, lng: 123.8854 }
const FIXTURE_MAP_JOBS = [
  { id: 'r1', lat: 10.3199, lng: 123.8931, price: 150 },
  { id: 'r2', lat: 10.3101, lng: 123.8790, price: 220 },
]
const FIXTURE_COLLECTORS = [
  { collectorId: 'c1', lat: 10.3170, lng: 123.8880 },
  { collectorId: 'c2', lat: 10.3120, lng: 123.8900 },
  { collectorId: 'c3', lat: 10.3210, lng: 123.8820 },
]
```

Screen entry:

```jsx
  dispatchmap: (
    <div className="fixed inset-0 mx-auto w-full max-w-[430px]">
      <DispatchMap
        center={FIXTURE_CENTER}
        zoom={14}
        jobs={FIXTURE_MAP_JOBS}
        collectors={FIXTURE_COLLECTORS}
        radar={{ ...FIXTURE_CENTER, radiusMeters: 5000 }}
      />
    </div>
  ),
```

Add `dispatchmap` to the screens comment. Note: preview renders real OSM tiles (needs network in dev) — this intentionally supersedes the spec's "static styled div" line; Task 7 updates the spec.

- [ ] **Step 5: Lint + visual check + tile tuning**

Run: `npm run lint` → passes.
Screenshot `?screen=dispatchmap` (allow ~4s for tiles): dark forest-green ground, legible lighter road lines, two ink/gold price pins, three glowing mint dots, gold center pin with three concentric gold rings at graduated radii.
**Tune the tile filter now:** if the ground reads gray/blue/purple instead of deep green, adjust `hue-rotate`/`sepia`/`saturate` in the `.leaflet-layer` rule in `index.css` and re-screenshot until it sits in the `#14311f` family. Record the final values in the commit message.

- [ ] **Step 6: Commit**

```bash
git add src/components/DispatchMap.jsx src/index.css src/dev/preview.jsx src/App.jsx
git commit -m "feat: shared DispatchMap with price pins, live dots, radar rings"
```

---

### Task 4: `DispatchHome` — map-first home (replaces `HomeFeed`)

**Files:**
- Create: `src/components/DispatchHome.jsx`
- Create: `src/components/JobRow.jsx`
- Modify: `src/components/ui/Toggle.jsx` (optional gold knob)
- Modify: `src/App.jsx` (swap HomeFeed → DispatchHome, conditional TopBar, presence hook)
- Delete: `src/components/HomeFeed.jsx`
- Modify: `src/dev/preview.jsx` (rebuild `dispatchhome` fixture)

**Interfaces:**
- Consumes: `BottomSheet` (Task 2 API), `DispatchMap` via lazy import (Task 3 API), existing `rankRequests(requests, location)` (annotates `distanceMeters`), `useNearbyPresence(lat, lng)` → `[{collectorId, lat, lng, …}]`, existing App callbacks (`onCompose`, `onAccept(id)`, `onOpenThread(request)`, `onOpenDispatchRadar(request)`).
- Produces: `<DispatchHome requests currentUser onCompose onAccept onOpenThread onOpenDispatchRadar online setOnline location nearbyCollectors />` and `<JobRow request distanceMeters selected action onClick />` (JobRow reused by nothing else yet; Task 6 mirrors its price styling). `Toggle` gains optional boolean prop `accent` (gold knob when checked).

- [ ] **Step 1: Add the `accent` prop to `src/components/ui/Toggle.jsx`**

Change the signature to `export default function Toggle({ checked, onChange, label, sub, accent = false })` and the knob `background` line to:

```js
            background: accent && checked ? 'var(--accent)' : 'var(--surface-card)',
```

- [ ] **Step 2: Create `src/components/JobRow.jsx`**

```jsx
import { formatDistance } from '../utils/haversine'
import StatusBadge from './StatusBadge'
import sampleTrash from '../assets/sample_trash.jpg'

// Slim dispatch job row: thumbnail, place, distance, status/tag chip, and the
// price set in the display serif. Selecting a row reveals its `action` node.
export default function JobRow({ request, distanceMeters, selected, action, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.() }}
      className="tt-press flex w-full flex-col rounded-[14px] border p-2.5 text-left"
      style={{
        background: 'var(--surface-card)',
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-3">
        <img
          src={request.photo || sampleTrash}
          alt=""
          className="h-12 w-12 flex-none rounded-[10px] object-cover"
          onError={(e) => { if (e.currentTarget.src !== sampleTrash) e.currentTarget.src = sampleTrash }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {request.gps || 'Pickup nearby'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {distanceMeters != null && <span>{formatDistance(distanceMeters)}</span>}
            <StatusBadge variant={request.status === 'open' ? request.tags?.[0] : request.status} />
          </div>
        </div>
        <span className="font-display text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
          ₱{request.price}
        </span>
      </div>
      {selected && action && <div className="mt-2.5">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/DispatchHome.jsx`**

```jsx
import { lazy, Suspense, useMemo, useState } from 'react'
import BottomSheet from './ui/BottomSheet'
import Toggle from './ui/Toggle'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import EmptyState from './ui/EmptyState'
import JobRow from './JobRow'
import { rankRequests } from '../utils/rankRequests'
import { haversineDistance } from '../utils/haversine'

const DispatchMap = lazy(() => import('./DispatchMap'))

const NAV_HEIGHT = 64 // BottomNav clearance for the sheet
const DEFAULT_CENTER = { lat: 10.3157, lng: 123.8854 } // no GPS, no pins: Cebu City

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--surface-ink)' }}>
      <span className="tt-live-dot" />
    </div>
  )
}

function SectionLabel({ children, aside }) {
  return (
    <div className="mb-2 mt-5 flex items-baseline justify-between">
      <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {children}
      </h2>
      {aside && (
        <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>{aside}</span>
      )}
    </div>
  )
}

// The map-first dispatch home. The map IS the screen; chrome floats on top,
// and all list content lives in the draggable BottomSheet.
export default function DispatchHome({
  requests,
  currentUser,
  onCompose,
  onAccept,
  onOpenThread,
  onOpenDispatchRadar,
  online,
  setOnline,
  location,
  nearbyCollectors,
}) {
  const myId = currentUser?.id
  const [detent, setDetent] = useState('half')
  const [selectedJobId, setSelectedJobId] = useState(null)

  const feed = useMemo(
    () => [...requests].sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)),
    [requests]
  )
  const myActive = feed.filter(
    (r) => (r.postedBy === myId || r.collectedBy === myId) && r.status !== 'paid'
  )
  const openOthers = feed.filter((r) => r.status === 'open' && r.postedBy !== myId)
  const nearest = location ? rankRequests(openOthers, location) : openOthers.slice(0, 5)

  const firstPinned = feed.find((r) => r.lat != null && r.lng != null)
  const center = location || (firstPinned ? { lat: firstPinned.lat, lng: firstPinned.lng } : DEFAULT_CENTER)

  const distanceTo = (r) =>
    location && r.lat != null ? haversineDistance(location.lat, location.lng, r.lat, r.lng) : null

  return (
    <div className="fixed inset-0 mx-auto w-full max-w-[430px] overflow-hidden">
      {/* Map layer */}
      <div className="absolute inset-x-0 top-0" style={{ bottom: NAV_HEIGHT }}>
        <Suspense fallback={<MapSkeleton />}>
          <DispatchMap
            center={center}
            zoom={14}
            jobs={openOthers}
            collectors={nearbyCollectors}
            selectedJobId={selectedJobId}
            onSelectJob={(j) => { setSelectedJobId(j.id); setDetent('half') }}
          />
        </Suspense>
      </div>

      {/* Floating top chrome */}
      <div className="absolute inset-x-3 top-3 z-20 flex flex-col gap-2">
        <div
          className="flex items-center justify-between rounded-[16px] border px-4 py-2.5"
          style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)', boxShadow: 'var(--shadow-raised)' }}
        >
          <span className="font-display text-[19px] leading-none" style={{ fontWeight: 600 }}>
            <span style={{ color: 'var(--text-on-ink)' }}>Ko</span>
            <span style={{ color: 'var(--accent)' }}>lek</span>
          </span>
          <Avatar name={currentUser?.name || '?'} />
        </div>
        <button
          onClick={onCompose}
          className="tt-press flex items-center gap-2.5 rounded-[16px] border px-4 py-3 text-left"
          style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)', boxShadow: 'var(--shadow-raised)' }}
        >
          <span className="flex-1 text-[13px]" style={{ color: 'var(--text-on-ink-muted)' }}>
            Got trash to clear? Post a pickup…
          </span>
          <span
            className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[15px] font-bold"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            +
          </span>
        </button>
      </div>

      {/* Content sheet */}
      <BottomSheet detent={detent} onDetentChange={setDetent} bottomOffset={NAV_HEIGHT}>
        {!location && (
          <div
            className="mb-1 rounded-[12px] border px-3 py-2 text-[12px]"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Turn on location to go on duty and see distances — Kolek only uses it while the app is open.
          </div>
        )}
        <Toggle
          checked={online}
          onChange={location ? setOnline : () => {}}
          accent
          label={online ? 'On duty' : 'Go online'}
          sub={location ? 'Receive dispatch pings nearby' : 'Needs location access'}
        />

        <SectionLabel aside={nearest.length > 0 ? `${nearestCountLabel(nearest.length)}` : undefined}>
          Jobs nearby
        </SectionLabel>
        {nearest.length === 0 ? (
          <EmptyState
            icon="📡"
            title="No jobs nearby"
            body="You'll get pinged the moment someone posts a pickup."
          />
        ) : (
          <div className="space-y-2">
            {nearest.map((r) => (
              <JobRow
                key={r.id}
                request={r}
                distanceMeters={r.distanceMeters ?? distanceTo(r)}
                selected={selectedJobId === r.id}
                onClick={() => setSelectedJobId(selectedJobId === r.id ? null : r.id)}
                action={
                  <Button
                    full
                    size="sm"
                    style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                    onClick={(e) => { e.stopPropagation(); onAccept(r.id) }}
                  >
                    Accept for ₱{r.price}
                  </Button>
                }
              />
            ))}
          </div>
        )}

        {myActive.length > 0 && (
          <>
            <SectionLabel aside={`${myActive.length} active`}>My pickups & jobs</SectionLabel>
            <div className="space-y-2">
              {myActive.map((r) => (
                <JobRow
                  key={r.id}
                  request={r}
                  distanceMeters={distanceTo(r)}
                  selected
                  onClick={() =>
                    r.postedBy === myId && r.status === 'open' ? onOpenDispatchRadar(r) : onOpenThread(r)
                  }
                  action={
                    r.postedBy === myId && r.status === 'open' ? (
                      <Button full size="sm" variant="ink" onClick={(e) => { e.stopPropagation(); onOpenDispatchRadar(r) }}>
                        View dispatch radar
                      </Button>
                    ) : (
                      <Button full size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onOpenThread(r) }}>
                        Open chat
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          </>
        )}
      </BottomSheet>
    </div>
  )
}

function nearestCountLabel(n) {
  return n === 1 ? '1 open job' : `${n} open jobs`
}
```

- [ ] **Step 4: Rewire `src/App.jsx`**

1. Replace `import HomeFeed from './components/HomeFeed'` with `import DispatchHome from './components/DispatchHome'`, and add `import { useNearbyPresence } from './hooks/useNearbyPresence'`.
2. After the `useViewerLocation()` line, add:

```js
  const homeCollectors = useNearbyPresence(location?.lat ?? null, location?.lng ?? null)
```

3. Change `<TopBar />` (line 566) to `{view !== 'home' && <TopBar />}` — the home has its own floating chrome.
4. Replace the whole `{view === 'home' && (<HomeFeed …/>)}` block with:

```jsx
        {view === 'home' && (
          <DispatchHome
            requests={requests}
            currentUser={currentUser}
            onCompose={() => setComposerOpen(true)}
            onAccept={(id) => updateStatus(id, 'accepted')}
            onOpenThread={openThread}
            onOpenDispatchRadar={(req) => setActiveDispatchRequestId(req.id)}
            online={online}
            setOnline={setOnline}
            location={location}
            nearbyCollectors={homeCollectors}
          />
        )}
```

(`onLike`/`credentialFor` are no longer passed — request-like UI is gone from the home per the dispatch spec; `handleLike` stays for other views.)

5. Delete `src/components/HomeFeed.jsx` (`git rm src/components/HomeFeed.jsx`).

- [ ] **Step 5: Rebuild the `dispatchhome` preview fixture in `src/dev/preview.jsx`**

Remove the `HomeFeed` import; add `import DispatchHome from '../components/DispatchHome'`. Give the two `FIXTURE_REQUESTS` coordinates by adding to `r1`: `lat: 10.3199, lng: 123.8931,` and to `r2`: `lat: 10.3101, lng: 123.8790,`. Replace the `dispatchhome` screen entry with:

```jsx
  dispatchhome: (
    <>
      <DispatchHome
        requests={FIXTURE_REQUESTS}
        currentUser={FIXTURE_USER}
        onCompose={() => {}}
        onAccept={() => {}}
        onOpenThread={() => {}}
        onOpenDispatchRadar={() => {}}
        online={true}
        setOnline={() => {}}
        location={FIXTURE_CENTER}
        nearbyCollectors={FIXTURE_COLLECTORS}
      />
      <BottomNav view="home" setView={() => {}} unreadCount={2} onOpenMessages={() => {}} />
    </>
  ),
```

- [ ] **Step 6: Lint + visual check**

Run: `npm run lint` → passes (the deleted HomeFeed must leave no dangling imports — grep `HomeFeed` across `src/` to confirm zero hits).
Screenshot `?screen=dispatchhome`: forest map filling the screen; ink top bar with gold "lek" and avatar; ink composer pill; cream sheet at half height with gold-knob "On duty" toggle, one open JobRow (₱150, Fraunces price), and "My pickups & jobs" with the accepted request showing "Open chat". Bottom nav visible below the sheet. Click a price pin via `agent-browser` and re-screenshot: the matching JobRow gains a gold border.

- [ ] **Step 7: Commit**

```bash
git add -A src/components src/App.jsx src/dev/preview.jsx
git commit -m "feat: map-first DispatchHome replaces HomeFeed browse list"
```

---

### Task 5: `useOffers` hook + `DispatchRadar` rebuild

**Files:**
- Create: `src/hooks/useOffers.js`
- Modify: `src/components/DispatchRadar.jsx` (full rewrite)
- Modify: `src/App.jsx` (hooks + overlay restyle + props)
- Modify: `src/index.css` (remove stale `.tt-radar` keyframe)
- Modify: `src/dev/preview.jsx` (rebuild `radar` fixture)

**Interfaces:**
- Consumes: `DispatchMap` (Task 3), `useNearbyPresence`.
- Produces: `useOffers(requestId)` → `[{id, request_id, collector_id, price, status, profiles: {name, avatar_url}}]` (pending only, live-updating; empty array when `requestId` is null). New `DispatchRadar` props: `{ request, collectors, offers, onCancel, onAcceptOffer, onDeclineOffer }` — pure presentation, no Supabase.

- [ ] **Step 1: Create `src/hooks/useOffers.js`** (logic moved verbatim from the old DispatchRadar so App owns reads-via-hooks per the architecture)

```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Pending price offers for one request (poster side): fetch once, then track
// INSERTs (enriched with the collector's profile) and drop offers that leave
// `pending`. Returns [] while requestId is null.
export function useOffers(requestId) {
  const [offers, setOffers] = useState([])

  useEffect(() => {
    if (!requestId) {
      setOffers([])
      return
    }
    setOffers([])

    supabase
      .from('price_offers')
      .select('*, profiles(name, avatar_url)')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .then(({ data }) => {
        if (data) setOffers(data)
      })

    const channel = supabase
      .channel(`offers:${requestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'price_offers', filter: `request_id=eq.${requestId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', payload.new.collector_id)
              .single()
              .then(({ data }) => {
                setOffers((prev) => [...prev, { ...payload.new, profiles: data }])
              })
          } else if (payload.eventType === 'UPDATE' && payload.new.status !== 'pending') {
            setOffers((prev) => prev.filter((o) => o.id !== payload.new.id))
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [requestId])

  return offers
}
```

- [ ] **Step 2: Rewrite `src/components/DispatchRadar.jsx`**

```jsx
import { lazy, Suspense } from 'react'
import Avatar from './ui/Avatar'
import Button from './ui/Button'

const DispatchMap = lazy(() => import('./DispatchMap'))

const BROADCAST_RADIUS_METERS = 5000

function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--surface-ink)' }}>
      <span className="tt-live-dot" />
    </div>
  )
}

// Poster-side radar: the pickup pin with pulsing 5 km broadcast rings, live
// collector dots, and incoming counter-offers. Pure presentation — offers and
// presence arrive via props (useOffers / useNearbyPresence in App.jsx).
export default function DispatchRadar({ request, collectors, offers, onCancel, onAcceptOffer, onDeclineOffer }) {
  const online = collectors.length

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--surface)' }}>
      <div className="relative min-h-[240px] flex-1">
        <Suspense fallback={<MapSkeleton />}>
          <DispatchMap
            center={{ lat: request.lat, lng: request.lng }}
            zoom={13}
            collectors={collectors}
            radar={{ lat: request.lat, lng: request.lng, radiusMeters: BROADCAST_RADIUS_METERS }}
          />
        </Suspense>

        {/* Live broadcast pill */}
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center">
          <div
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
            style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)', color: 'var(--text-on-ink)' }}
          >
            <span className="tt-live-dot" style={{ width: 10, height: 10 }} />
            Broadcast active
            <span style={{ color: 'var(--text-on-ink-muted)', fontWeight: 400 }}>
              · {online} on duty nearby
            </span>
          </div>
        </div>
      </div>

      <div
        className="relative z-10 space-y-4 p-4"
        style={{
          background: 'var(--surface)',
          borderRadius: '22px 22px 0 0',
          marginTop: -22,
          boxShadow: 'var(--shadow-raised)',
        }}
      >
        <div className="text-center">
          <h3 className="font-display text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Finding your Green Collector
          </h3>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            {online > 0
              ? 'Your request is live on the radar of collectors nearby.'
              : 'Nobody is on duty right now — your request stays posted, and collectors get pinged as they come online.'}
          </p>
        </div>

        <div className="max-h-[36vh] space-y-2.5 overflow-y-auto">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-[14px] border p-3"
              style={{ background: 'var(--surface-card)', borderColor: 'var(--accent)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar name={offer.profiles?.name || '?'} src={offer.profiles?.avatar_url} />
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {offer.profiles?.name || 'Green Collector'}
                    </div>
                    <div className="text-[12px] font-medium" style={{ color: 'var(--warning)' }}>
                      Counter-offer
                    </div>
                  </div>
                </div>
                <div className="font-display text-[20px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  ₱{offer.price}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => onDeclineOffer(offer.id)}>
                  Decline
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                  onClick={() => onAcceptOffer(offer.id)}
                >
                  Accept ₱{offer.price}
                </Button>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="py-6 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Waiting for responses…
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          full
          onClick={() => onCancel(request.id)}
          style={{ color: 'var(--danger)' }}
        >
          Cancel request
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire hooks and restyle the radar overlay in `src/App.jsx`**

1. Add `import { useOffers } from './hooks/useOffers'`.
2. With the other hooks at the top of `App()` (unconditional call order):

```js
  const radarRequest = activeDispatchRequestId ? requests.find((r) => r.id === activeDispatchRequestId) : null
  const radarOffers = useOffers(activeDispatchRequestId)
  const radarCollectors = useNearbyPresence(radarRequest?.lat ?? null, radarRequest?.lng ?? null)
```

(Remove any duplicate `requests.find(r => r.id === activeDispatchRequestId)` lookups below in favor of `radarRequest`.)
3. Replace the radar overlay block (lines 659–676) with:

```jsx
      {radarRequest && (
        <div className="fixed inset-0 z-[200] mx-auto flex w-full max-w-[430px] flex-col overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div
            className="flex items-center border-b p-4"
            style={{ background: 'var(--surface-ink)', borderColor: 'var(--border-ink)' }}
          >
            <button
              className="tt-press -ml-2 p-2"
              style={{ color: 'var(--text-on-ink-muted)' }}
              onClick={() => setActiveDispatchRequestId(null)}
              aria-label="Back"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h2 className="flex-1 pr-6 text-center font-display text-[17px] font-semibold" style={{ color: 'var(--text-on-ink)' }}>
              Dispatch Radar
            </h2>
          </div>
          <div className="relative flex-1 overflow-hidden">
            <DispatchRadar
              request={radarRequest}
              collectors={radarCollectors}
              offers={radarOffers}
              onCancel={cancelRequest}
              onAcceptOffer={acceptPriceOffer}
              onDeclineOffer={declinePriceOffer}
            />
          </div>
        </div>
      )}
```

- [ ] **Step 4: Remove the stale `.tt-radar` keyframe from `src/index.css`**

Delete the `@keyframes tt-radar-ping` + `.tt-radar` block (old 22px center-pinned rings — the geographic rings replaced them) and drop `.tt-radar` from the reduced-motion list. Confirm no remaining users: `grep -rn "tt-radar\b" src/` → only `tt-radar-ring`/`tt-radar-pin` hits remain.

- [ ] **Step 5: Rebuild the `radar` preview fixture**

In `src/dev/preview.jsx`, replace the `radar` screen entry with (reusing `FIXTURE_COLLECTORS`; the old fixture's wrapper header can go):

```jsx
  radar: (
    <div className="fixed inset-0 mx-auto flex w-full max-w-[430px] flex-col" style={{ background: 'var(--surface)' }}>
      <DispatchRadar
        request={{ ...FIXTURE_REQUESTS[0], lat: FIXTURE_CENTER.lat, lng: FIXTURE_CENTER.lng }}
        collectors={FIXTURE_COLLECTORS}
        offers={[
          { id: 'o1', price: 180, profiles: { name: 'Carl Avila', avatar_url: null } },
          { id: 'o2', price: 200, profiles: { name: 'Juana Reyes', avatar_url: null } },
        ]}
        onCancel={() => {}}
        onAcceptOffer={() => {}}
        onDeclineOffer={() => {}}
      />
    </div>
  ),
```

- [ ] **Step 6: Lint + visual check**

Run: `npm run lint` → passes.
Screenshot `?screen=radar`: forest map upper half with gold pin, three pulsing gold rings at graduated radii, three mint dots, ink "Broadcast active · 3 on duty nearby" pill; cream lower panel with Fraunces "Finding your Green Collector", two counter-offer cards with gold Accept buttons, quiet red "Cancel request".

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useOffers.js src/components/DispatchRadar.jsx src/App.jsx src/index.css src/dev/preview.jsx
git commit -m "feat: rebuild DispatchRadar on shared map with pin-anchored rings"
```

---

### Task 6: `IncomingOffer` rebuild + `CountdownRing`

**Files:**
- Create: `src/components/CountdownRing.jsx`
- Modify: `src/components/IncomingOffer.jsx` (full rewrite)
- Modify: `src/App.jsx` (open-guard + onDismiss)
- Modify: `src/dev/preview.jsx` (rebuild `offer` fixture)

**Interfaces:**
- Produces: `<CountdownRing seconds size stroke onExpire />` — SVG ring that drains over `seconds`, pauses while `document.hidden`, fires `onExpire()` exactly once; strokes in `currentColor`. New `IncomingOffer` props: existing `{ request, poster, distanceMeters, onAccept, onPass, onCounter }` **plus `onDismiss`** (countdown expiry / quiet close — no localStorage), **minus `credentialFor`** (removed).

- [ ] **Step 1: Create `src/components/CountdownRing.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'

// SVG countdown ring in currentColor. Drains over `seconds`, pausing while the
// tab is hidden (backgrounded collectors shouldn't silently lose offers), then
// fires onExpire exactly once. Parent owns what expiry means.
export default function CountdownRing({ seconds = 25, size = 26, stroke = 3, onExpire }) {
  const [remaining, setRemaining] = useState(seconds)
  const expired = useRef(false)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    let last = performance.now()
    let raf
    const tick = (now) => {
      if (!document.hidden) {
        const dt = (now - last) / 1000
        setRemaining((prev) => Math.max(0, prev - dt))
      }
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (remaining <= 0 && !expired.current) {
      expired.current = true
      onExpireRef.current?.()
    }
  }, [remaining])

  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="color-mix(in srgb, currentColor 25%, transparent)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - remaining / seconds)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
```

(The ring conveys time remaining — informative, not decorative — so it stays under reduced motion.)

- [ ] **Step 2: Rewrite `src/components/IncomingOffer.jsx`**

```jsx
import { useState } from 'react'
import Button from './ui/Button'
import Avatar from './ui/Avatar'
import StatusBadge from './StatusBadge'
import CountdownRing from './CountdownRing'
import { formatDistance } from '../utils/haversine'
import sampleTrash from '../assets/sample_trash.jpg'

const OFFER_SECONDS = 25

// Collector-side dispatch ping: a takeover constrained to the 430px shell.
// The countdown expiring minimizes the takeover (onDismiss) — the job simply
// stays in the "Jobs nearby" sheet list. Pass (onPass) is the explicit
// don't-show-again action.
export default function IncomingOffer({ request, poster, distanceMeters, onAccept, onPass, onCounter, onDismiss }) {
  const [counterPrice, setCounterPrice] = useState('')
  const [isCountering, setIsCountering] = useState(false)

  return (
    <div
      className="tt-sheet fixed inset-0 z-[1000] mx-auto flex w-full max-w-[430px] flex-col"
      style={{ background: 'var(--surface)' }}
    >
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <h2 className="mt-1 text-center font-display text-[22px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          New pickup request
        </h2>

        <div className="relative overflow-hidden rounded-[16px]" style={{ boxShadow: 'var(--shadow-card)' }}>
          <img
            src={request.photo || sampleTrash}
            alt="Trash to collect"
            className="h-56 w-full object-cover"
            onError={(e) => { if (e.currentTarget.src !== sampleTrash) e.currentTarget.src = sampleTrash }}
          />
          <div
            className="absolute bottom-3 right-3 rounded-full px-3.5 py-1.5 font-display text-[18px] font-bold"
            style={{ background: 'var(--surface-ink)', color: 'var(--accent)', border: '1.5px solid var(--border-ink)' }}
          >
            ₱{request.price}
          </div>
        </div>

        <div
          className="flex items-center gap-3 rounded-[14px] border p-3"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          <Avatar name={poster?.name || '?'} src={poster?.avatar_url} />
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              {poster?.name || 'Someone'}
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              {request.gps || 'Nearby pickup'}
              {distanceMeters != null && <> · {formatDistance(distanceMeters)}</>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={request.tags} />
        </div>
      </div>

      <div className="flex-none space-y-3 border-t p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        {isCountering ? (
          <div
            className="space-y-3 rounded-[16px] border p-4"
            style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-center text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Offer a different price
            </h3>
            <div className="flex gap-2">
              <span
                className="flex items-center justify-center rounded-[12px] border px-4 font-display text-lg font-bold"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                ₱
              </span>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="tt-input flex-1 p-3 text-lg font-bold"
                placeholder={String(request.price)}
                min="1"
                max="99999"
                step="1"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCountering(false)}>
                Back
              </Button>
              <Button
                className="flex-1"
                style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                disabled={!counterPrice || Number(counterPrice) <= 0}
                onClick={() => onCounter(request.id, Number(counterPrice))}
              >
                Send offer
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              full
              className="py-3.5 text-[17px]"
              style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
              onClick={() => onAccept(request.id)}
            >
              <CountdownRing seconds={OFFER_SECONDS} onExpire={onDismiss} />
              Accept for ₱{request.price}
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setIsCountering(true)}>
                Offer a price
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => onPass(request.id)}>
                Pass
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Guard + wire dismissal in `src/App.jsx`**

In the IIFE that renders `IncomingOffer` (lines 678–698):
- Change the guard to also require the job to still be open: `if (!offerReq || offerReq.status !== 'open') return null` — this is the instant auto-dismiss when another collector wins (the realtime UPDATE flips `status`).
- Remove the `credentialFor={credentialFor}` prop.
- Add `onDismiss={() => setIncomingOfferReqId(null)}`.

- [ ] **Step 4: Rebuild the `offer` preview fixture**

Replace the `offer` screen entry in `src/dev/preview.jsx` with:

```jsx
  offer: (
    <IncomingOffer
      request={{ ...FIXTURE_REQUESTS[0], lat: 10.3199, lng: 123.8931 }}
      poster={{ name: 'Carl Avila', avatar_url: null }}
      distanceMeters={1200}
      onAccept={() => {}}
      onPass={() => {}}
      onCounter={() => {}}
      onDismiss={() => {}}
    />
  ),
```

- [ ] **Step 5: Lint + visual check**

Run: `npm run lint` → passes.
Screenshot `?screen=offer` at 430x900 **and** at 1280x900: at both sizes the takeover must stay ≤430px wide, centered. Content: Fraunces title, photo with ink/gold price coin, **one** poster card (no credential line), tag chips, gold Accept with the draining ring inside, Offer a price / Pass row. Wait ~26s and re-screenshot the 430px tab if convenient — the ring empties (expiry calls the no-op `onDismiss` in preview, so the card stays; in the app it minimizes).

- [ ] **Step 6: Commit**

```bash
git add src/components/CountdownRing.jsx src/components/IncomingOffer.jsx src/App.jsx src/dev/preview.jsx
git commit -m "feat: shell-constrained IncomingOffer with countdown ring"
```

---

### Task 7: BottomNav restyle, docs, final verification

**Files:**
- Modify: `src/components/BottomNav.jsx`
- Modify: `CLAUDE.md` (Styling + Architecture mentions)
- Modify: `docs/superpowers/specs/2026-07-13-dispatch-ux-redesign-design.md` (preview-fixture note)

**Interfaces:**
- Consumes tokens from Task 1. No API changes — `BottomNav` keeps `{ view, setView, unreadCount, onOpenMessages }`.

- [ ] **Step 1: Restyle `src/components/BottomNav.jsx`**

- `NavButton` color line → `style={{ color: active ? 'var(--accent)' : 'var(--text-on-ink-muted)' }}`.
- `NavButton` badge style → `style={{ background: 'var(--danger)', color: 'var(--on-brand)' }}`.
- `<nav>` style →

```js
      style={{
        background: 'var(--surface-ink)',
        borderTop: '1px solid var(--border-ink)',
        boxShadow: '0 -1px 12px rgba(0, 0, 0, 0.25)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
```

- Center messages button style →

```js
            style={{
              width: 52,
              height: 52,
              marginTop: -18,
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              boxShadow: '0 6px 16px color-mix(in srgb, var(--accent) 45%, transparent)',
            }}
```

- Center button badge style → `background: 'var(--danger)', color: 'var(--on-brand)', boxShadow: '0 0 0 2px var(--surface-ink)'`.

- [ ] **Step 2: Update `CLAUDE.md`**

In **Architecture**: replace mentions of `HomeFeed` ("the dispatch dashboard with 'Go Online' toggle…") with `DispatchHome` (map-first home: full-bleed forest map, floating ink chrome, draggable `ui/BottomSheet` with Go Online + jobs + active pickups; `JobRow` list items). Note `useOffers` in the realtime-hooks list. Note the ProfileView theme picker is removed (single theme).

In **Styling**: rewrite the theming paragraph — single `eco-premium` theme (cream surfaces, forest-ink map chrome via `--surface-ink`/`--border-ink`/`--text-on-ink*`, gold `--accent` reserved for money/live signals, `--live-dot` mint); `themes.js` mechanism retained for future variants; map tiles always forest-ink via the unconditional `.leaflet-layer` filter (no more `data-dark` tile rule); Fraunces sets titles and every peso amount. Update the preview screens list: `…|dispatchhome|radar|offer|bottomsheet|dispatchmap` and note themes param now resolves to `eco-premium` only. Add `BottomSheet` to the ui/ primitives list.

- [ ] **Step 3: Update the spec's preview note**

In `docs/superpowers/specs/2026-07-13-dispatch-ux-redesign-design.md`, change "(fixture map = static styled div, no tiles)" to "(fixtures render the real Leaflet map; OSM tiles need network in dev)".

- [ ] **Step 4: Full verification pass**

```bash
npm run lint
npm run build
```

Expected: both succeed (build confirms the SW/injectManifest + lazy chunks still assemble; `DispatchMap` should appear as its own chunk in the build output — grep the output for a `DispatchMap`/leaflet chunk line).

Screenshot every touched screen at 430x900: `shell`, `cards`, `dispatchhome`, `radar`, `offer`, `bottomsheet`, `dispatchmap`, plus `feed` and `profile` (regression: cream palette applied, nothing unreadable, no bright `#2fa96a` remnants). BottomNav must be ink with gold center button on all shell-bearing screens.

Manual end-to-end (needs the two test accounts + real backend; document results, don't skip silently): Herald posts → radar with rings/count; Carl online → ping with countdown → accept → handoff to chat; countdown expiry minimizes; counter-offer round trip; cancel while pending. `node scripts/verify-dispatch.mjs` for the realtime legs where a second browser isn't available.

- [ ] **Step 5: Commit**

```bash
git add src/components/BottomNav.jsx CLAUDE.md docs/superpowers/specs/2026-07-13-dispatch-ux-redesign-design.md
git commit -m "feat: ink/gold BottomNav; docs for eco-premium dispatch redesign"
```
