# Linisa — Live Demo Script & Demo-Day Checklist

Target: **3–5 minutes**, slotted at Slide 4 of the deck. The demo's job is to prove one sentence: *"this is not a mockup — the marketplace, the payments handshake, and the credential are real."*

---

## Setup (before you're on stage)

**Primary path — live app, two devices/windows:**
- Window/phone A signed in as the **Poster** (Herald test account), window/phone B as the **Green Collector** (Carl test account).
- Both accounts must be party to the demo request — `messages` and `collector_locations` are RLS-scoped to the request's poster/collector, so chat and tracking only work between these two.
- Pre-stage one request already in `accepted` status *before* the demo (see why in the flow below), plus 2–3 open requests with good photos so the home feed looks alive.
- Note: **10-minute idle logout** — re-authenticate both sessions right before you're called up.

**Fallback path — zero-backend fixtures (no Wi-Fi risk):**
- `npm run dev`, then `/preview.html?screen=<name>&theme=fresh-canopy` renders real components with fixture data, no Supabase needed.
- Useful screens: `shell` (whole app), `cards`, `thread` (chat + journey rail), `pay`, `confirmpay`, `credential` (the Green Collector ID card), `board` (leaderboard), `feed`.
- Rehearse the tab order so it feels like a walkthrough, not a slideshow.

---

## The script (~4 minutes)

**Beat 1 — Post the mess (Poster, ~45s)**
"Here's a resident with a pile the truck won't take." → New request: snap/pick photo, pin location on the map, tag it *Mixed*, set a **₱150 bounty**, post. Point out it instantly appears on the collector's home feed (realtime, no refresh).

**Beat 2 — The credential (Collector → Poster, ~60s)**
On the collector's phone, accept the job. Switch to the poster: "Before this person arrives, look what the poster can see." Tap the collector's trust line → the **Green Collector ID card**: verified badge, pickups completed, rating, and the career ladder — Verified → Top-Rated → Certified → Team Lead → Barangay Coordinator. **This is the pitch's core visual — linger on it.** "This isn't a stranger on a motorbike. And this credential can't be faked — it's computed from real, paid, rated jobs."

**Beat 3 — Tracking + proof (~45s)**
Show the poster's live map: collector position, proximity label ("Green Collector on the way → nearby"). Then on the pre-staged `accepted` request, upload the **after-photo** as the collector. (Pre-staging avoids waiting for real GPS movement on stage.)

**Beat 4 — The payment handshake (~60s)**
Poster reviews the before/after proof → accepts → pay sheet → GCash, reference number → **payment sent**. Collector's phone pops the confirmation → **confirms receipt** → status flips to *paid*. "Money moved on GCash rails; Linisa recorded a dual-confirmed, auditable handshake. That record is what the 12% take rate and the LGU dashboard are built on."

**Beat 5 — Close the loop (~30s)**
Both sides rate each other. Flash the **leaderboard** and the landing page's **live impact counters** — "the numbers in my deck and the numbers in the app are the same numbers." Back to slides.

**If anything breaks:** don't debug on stage. Say "let me show you the component states directly" and switch to the `/preview.html` tabs you rehearsed.

---

## Demo-polish checklist (do these in the days before)

- [ ] **Seed production data** so the landing page impact strip shows real non-zero numbers (a handful of genuinely completed paid pickups; the pre-launch fallback copy works, but live numbers land harder).
- [ ] **Verify both test accounts log in** and Carl's account has `verified_at` set (service-role/SQL only — the app can't set it) so the Verified badge shows in Beat 2.
- [ ] **Give the collector account history**: ~20+ paid pickups at high ratings if you want the **Top-Rated** tier to display instead of plain Verified — much stronger on the ID card.
- [ ] **Fill in collector payment details** (GCash/Maya numbers on the profile) so the pay sheet is populated.
- [ ] **Good photos** on the seeded requests — the feed is the first thing the panel sees.
- [ ] **Pre-stage the `accepted` request** for Beats 3–4.
- [ ] **PWA install moment** (optional, 10s): "Add to Home Screen" on the phone — no app store, works on low-end Android. Cheap applause line for a TBI panel.
- [ ] **Theme**: Fresh Canopy (light) projects better than a dark theme on most venue projectors.
- [ ] **Network plan B**: phone hotspot ready; `/preview.html` rehearsed as plan C.
- [ ] **Screen-record a full happy-path run** the night before — if the venue bans live devices or everything fails, you have a video.
- [ ] **Re-login both accounts** right before going on stage (10-min idle logout).
- [ ] Charge both phones; crank screen brightness; disable notifications.
