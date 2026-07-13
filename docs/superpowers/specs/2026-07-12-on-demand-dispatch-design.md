# On-Demand Dispatch — "Grab for trash"

**Date:** 2026-07-12

## Context
Kolek previously worked like a classifieds feed: posters created pickup requests that sat in a browsable `HomeFeed`, and collectors scrolled to find work.
The new requirement shifts this to a Grab/inDrive-style dispatch experience:
- A poster submits a request and watches a radar map of nearby online Green Collectors.
- Collectors get pinged and accept/pass/counter-offer.
- The browse feed is removed.
- Chat, the payment handshake, credentials, community feed, and leaderboard all remain unchanged.

## Locked Decisions
- **Broadcast, first-accept dispatch:** (inDrive-style, not sequential Grab assignment). A request that nobody takes live stays pending and remains offered as collectors come online.
- **"Go Online" toggle presence:** Explicit opt-in; location heartbeats only fire while online with the app open.
- **Poster sets the price:** Collectors may straight-accept (first wins) or send a price counter-offer the poster can accept/decline. Chat haggling is also possible.
- **Web Push now:** System notifications to offline collectors are what makes dispatch viable at low collector density.
- **DB-driven broadcast:** The request row IS the offer; there is no dispatch server. One Edge Function is used only for sending push notifications.
- **Request lifecycle:** (`open→accepted→collected→payment_sent→paid` + disputes + payment handshake) is unchanged.

## Data Model Updates
- **`collector_presence`**: `collector_id` uuid PK → profiles, `lat`, `lng`, `online` bool, `updated_at`. RLS: owner insert/update own row; SELECT for authenticated. Added to realtime publication.
- **`price_offers`**: `id`, `request_id` FK, `collector_id` FK, `price` numeric, `status` text (`pending|accepted|declined`), `created_at`. RLS: collector inserts own pending offers on open requests; readable by the request's poster + the offering collector; poster updates status. Added to realtime publication.
- **`push_subscriptions`**: `id`, `user_id` FK, `endpoint` unique, `p256dh`, `auth`, `created_at`. Owner-only RLS (service role reads it in the Edge Function).
- **`accept_price_offer(offer_id)`**: SECURITY DEFINER function: atomically, only if the request is still `open` and caller is its poster, sets `requests.price = offer.price`, `status='accepted'`, `collected_by = offer.collector_id`; marks that offer `accepted`, sibling pending offers `declined`.

## UX / UI Changes
- **Collector Side:**
  - `IncomingOffer` full-screen card overlay with accept/pass/counter-offer capabilities.
  - "Go Online" toggle prominently displayed on the Home feed.
- **Poster Side:**
  - `DispatchRadar` UI when posting a request, showing nearby active collectors and incoming price offers.
  - Active pickups displayed cleanly on the new dispatch home.
- **Home Feed Rework:**
  - Replaces old scrollable list of open requests.
  - Contains composer, Go Online toggle, active pickups, and nearby jobs.
- **System Notification (Web Push):**
  - Offline collectors get notified "New pickup — ₱{price}, {distance} away". Tapping opens/focuses the app.
