# Kolek — Business Proposal

**Professional Green Collectors, one trash at a time.**
*Malinis na barangay, powered by neighbors.*

Prepared for: **[FILL IN — incubator/program name]** · Date: **[FILL IN]**
Proponent: **[FILL IN — your name, course/affiliation, contact details]**

---

## 1. Executive Summary

Kolek is a working two-sided marketplace that turns informal waste-picking into a **credentialed green profession**. Residents ("Posters") post trash-pickup requests with a peso bounty; verified, rated **Green Collectors** accept the job, clean up, prove it with a before/after photo, and get paid via GCash, Maya, or cash — confirmed by both sides in the app.

The insight is that the Philippines already has the workforce: **more than 100,000 informal waste workers** keep our cities functioning, invisibly and often for less than a dollar a day. What they lack is not willingness but **trust infrastructure** — identity, ratings, proof of work, and a career ladder. Kolek is that infrastructure. The professionalized collector is the product; the app is the coordination layer.

**Status today:** a live, security-audited web app (installable PWA) with the full request lifecycle, real payments handshake, live GPS tracking, in-app chat, a derived tamper-proof credential system, community feed, and leaderboard — built on React + Supabase with row-level security as the authorization boundary.

**Business model (commercialization plan):** a hybrid of (a) a **12% platform take rate** on pickup bounties once in-app payment rails (PayMongo/GCash) launch, and (b) a **barangay/LGU SaaS subscription** for a waste-hotspot and workforce dashboard that helps LGUs meet their RA 9003 obligations without expanding the municipal payroll.

**The ask:** ₱4.85M over 18 months (within the DOST Startup Grant Fund's ₱5M ceiling) to build the identity-verification pipeline, integrate payment rails, run a one-city barangay pilot, and ship the LGU dashboard — plus the incubator's mentorship and LGU/TESDA network access.

---

## 2. The Problem

**The Philippines generates ~23.6 million tons of solid waste per year — roughly 64,700 tons every day** — and the volume grows with population and urbanization ([NSWMC projections via EnP Tinio](https://enptinio.com/statistics-philippines-solid-waste-management/), [Senate SEPO](https://legacy.senate.gov.ph/publications/SEPO/AAG_Philippine%20Solid%20Wastes_Nov2017.pdf)). Quezon City alone produces ~3,600 tons/day.

Three actors are failing to connect:

1. **Households and small businesses** have waste that municipal collection misses — the pile behind the sari-sari store, the post-fiesta debris, the vacant-lot dumping. Their alternatives are to wait, to dump, or to hand cash to a stranger with no accountability.

2. **Informal waste workers** — 100,000+ nationwide ([Eco-Business](https://www.eco-business.com/news/philippines-zero-waste-bid-relies-on-informal-workers/), [Inquirer](https://newsinfo.inquirer.net/2025114/ph-zero-waste-bid-relies-on-informal-workers)) — already recover an estimated **30% of municipal solid waste in cities like Quezon City** ([ResearchGate](https://www.researchgate.net/publication/228440300_Integration_of_the_informal_sector_into_municipal_solid_waste_management_in_the_Philippines_-_What_does_it_need)), yet many earn under a dollar a day, with no identity, no ratings, no proof of work, no path upward. They are essential and invisible.

3. **Barangays and LGUs** carry legal duties under **RA 9003** (Ecological Solid Waste Management Act): segregation and collection at the barangay level, a Materials Recovery Facility per barangay or cluster ([RA 9003](https://www.officialgazette.gov.ph/2001/01/26/republic-act-no-9003-s-2001/)). Two decades on, compliance studies still find barangay-level segregation, collection, and MRF establishment to be the weakest links ([Asian Journal of Multidisciplinary Studies](https://www.asianjournals.org/online/index.php/ajms/article/download/339/146/927), [Springer, 2025](https://link.springer.com/article/10.1007/s43621-025-01965-5)). LGUs lack both the budget to expand collection and the **data** to target it — they don't know where the hotspots are.

The gap is not equipment or willingness. It is **coordination and trust**: no mechanism connects the resident willing to pay, the worker willing to collect, and the barangay accountable for the outcome.

## 3. The Solution

Kolek is a mobile-first marketplace plus a professional credential system.

**The transactional loop (built and working):**

1. A Poster photographs the trash, pins the location on a map, tags the waste type (Biodegradable / Recyclable / Residual / Mixed), and sets a peso bounty.
2. A Green Collector nearby accepts the job. The poster sees the collector's **credential** — verified identity, pickups completed, average rating, tier — before they arrive, and tracks them live on a map ("on the way → nearby → arrived").
3. The collector cleans up and uploads an **after-photo** as proof.
4. The poster reviews the proof and pays (GCash / Maya / cash), recording method and reference; the collector confirms receipt. This **dual-confirmation handshake** — with a dispute branch if the proof is rejected — creates an auditable record of every job even while money moves on existing rails.
5. Both sides rate each other. Every completed job feeds the collector's credential.

**The credential (the moat):** a Green Collector's standing is **derived from verified work, not self-reported** — pickups completed, average poster rating, verification status — and rendered as a tappable ID card with a career ladder:

> **Verified → Top-Rated → Certified → Team Lead → Barangay Coordinator**

The first two tiers are live and computed from real job data (Top-Rated requires ≥20 paid pickups at a ≥4.8 rating). The upper rungs — TESDA-linked certification, team leadership, barangay coordination — are the roadmap this proposal funds. This transforms piece-rate work into **status and progression**: a profession with a ladder, not just gigs.

**The community loop (built):** a shared feed for cleanup events, environmental news, and posts; a leaderboard celebrating top collectors and posters. This keeps the app alive between transactions and roots it in the barangay.

**For the barangay (roadmap):** every pickup is a geotagged, photographed, timestamped data point. Aggregated, that is a **waste-hotspot map** — exactly the evidence base an LGU needs for RA 9003 planning and a certified green-jobs corps it did not have to hire.

## 4. Market Opportunity

*All figures below are estimates from cited public data; assumptions are stated explicitly.*

- **TAM (nationwide, both revenue lines):** The Philippines has **~26–28M households** and **42,046 barangays** ([PSA](https://psa.gov.ph/classification/psgc/barangays)). If 10% of households commission just one ₱150 pickup per month, that is ~₱4.7B/yr in gross marketplace volume → **~₱560M/yr platform revenue at a 12% take rate**. A dashboard subscription averaging ₱2,500/mo across all barangays is a further **~₱1.26B/yr B2G ceiling**.
- **SAM (urban Philippines):** Metro Manila plus the 30 largest cities — where waste density, e-wallet adoption, and disposable income concentrate. Digital payments already account for **57.4% of retail transaction volume** nationally; GCash reports **94M registered users**, Maya **50M+** ([DigitalInAsia](https://digitalinasia.com/gcash-vs-paymaya-vs-maya/), [Fintech News PH](https://fintechnews.ph/67153/e-wallets/top-ewallets-in-the-philippines-2025/)) — the payment behavior Kolek depends on is mainstream.
- **SOM (18-month pilot):** one pilot city, ~50 active barangays, ~200 active Green Collectors, ~8,000 paid pickups, and 20 barangay dashboard subscriptions. At the unit economics below this is a proof-of-model, not a profit engine — the goal of this phase is validated retention and LGU willingness-to-pay.

**Why now:**
- E-wallet rails (GCash/Maya) make micro-payments between neighbors frictionless — impossible five years ago.
- RA 9003 enforcement pressure on LGUs is rising while budgets are not; a budget-neutral workforce plus compliance data is a timely offer.
- The gig-economy pattern (FoodPanda, Grab, Angkas) has trained both sides of the market: Filipinos already trust app-mediated, rated, tracked service work.
- National zero-waste policy discussions explicitly point to **integrating the informal sector** as the missing piece ([Context/TRF](https://www.context.news/just-transition/philippines-zero-waste-bid-relies-on-informal-workers)).

## 5. The Product & Technology

**Built and live today** (demo available):

| Capability | Detail |
|---|---|
| Marketplace lifecycle | open → accepted → collected → payment_sent → paid, with dispute branch and payment-not-received escape hatch |
| Payments handshake | GCash/Maya/cash recorded with method + reference, dual-confirmed by both parties |
| Proof of work | Before/after photo uploads, validated client-side |
| Live tracking | Collector GPS streamed to the poster's map with proximity status |
| Trust layer | Derived Green Collector credential + ID card, two-sided ratings, per-request chat |
| Community | Feed (events/news/posts), likes, leaderboard |
| Distribution | Installable PWA + public marketing site with live impact stats — no app-store gatekeeping, works on low-end Android |

**Architecture:** React 19 + Vite single-page app on Vercel; Supabase (Postgres, Auth, Storage, Realtime) as the backend. All state syncs through Postgres realtime subscriptions. **Row-Level Security is the authorization boundary** — every table is RLS-protected, database triggers enforce that only the right party can advance the payment state, and the credential's verification field is writable only by the service role (tamper-proof by construction). An internal security audit rated overall risk **LOW**.

**Deliberate scope choices:** money moves on existing rails (no money-transmitter exposure at MVP stage); PWA over native (one codebase, instant updates, low-end-device reach). A native mobile app (Expo/React Native) is in progress on a separate track.

## 6. Business Model

Kolek currently charges nothing — by design, to remove friction while proving the loop. The commercialization plan has two reinforcing lines:

**Line 1 — Marketplace take rate (C2C).** Integrate PayMongo/GCash so bounties are paid *through* the app, and take **12% per completed pickup**. At an average ₱150 bounty that is **₱18/pickup**. The take rate is earned, not extracted: in-app payment removes the poster's "did they really pay?" and the collector's "will I really get paid?" risk, adds instant payout, and funds the credential/insurance layer. Off-app payment remains possible early on — the take rate lands only when the rails add real value.

**Line 2 — Barangay/LGU SaaS (B2G).** A subscription dashboard: waste-hotspot heatmaps, pickup volume and diversion trends, certified-collector roster, RA 9003-aligned reports. Tiered **₱1,500–₱5,000/month per barangay** by population, with city-level bundles. The pitch to the LGU: *a certified, rated cleanup workforce plus the data to govern it — without expanding the municipal payroll.* Barangay Potrero's zero-waste program saved **₱15,000/day** in hauling and tipping fees ([GAIA](https://www.no-burn.org/filipino-barangays-leading-the-way-in-zero-waste-models/)) — the dashboard subscription is a rounding error against that class of savings.

**Unit-economics sketch (pilot assumptions):**

| Metric | Assumption |
|---|---|
| Average bounty | ₱150 (poster-set) |
| Take rate | 12% → ₱18 revenue per pickup |
| Payment-processing cost | ~₱4–6 per transaction (PayMongo) |
| Contribution per pickup | ~₱12–14 |
| Collector doing 5 pickups/day | ~₱660/day net income — above minimum-wage day rates in most regions, flexible hours |
| Barangay subscription | ₱2,500/mo average |

**Later lines (not in this ask):** certification/training fees shared with TESDA partners, PPE/equipment micro-financing, brand-sponsored cleanup events through the community feed, and anonymized waste-flow data products.

## 7. Traction & Validation

- **Product:** fully functional MVP live at **[FILL IN — production URL]**; three development phases (design system → payment flow → public website/PWA) shipped.
- **Live impact counters** on the landing page (pickups cleaned, ₱ paid to Green Collectors, open bounties) read directly from production data — the pitch numbers and the app numbers are the same numbers.
- **Users / pilots:** [FILL IN — registered users, completed pickups, any barangay conversations or LOIs. If pre-launch, say so plainly: "pre-launch; pilot recruitment is the first incubation milestone." Panels respect a working product + honest zero over inflated vanity numbers.]
- **Validation to date:** [FILL IN — interviews with residents/collectors/barangay officials, survey results, demo-day feedback.]

## 8. Social Impact & SDG Alignment

Kolek is an impact venture with a commercial engine, aligned with the incubator's and DOST's development mandates:

- **SDG 8 — Decent Work and Economic Growth:** converts sub-$1/day invisible labor into rated, credentialed, better-paid work with a progression ladder; the TESDA-certification rung creates a formal skills pathway.
- **SDG 11 — Sustainable Cities and Communities:** cleaner barangays through demand-driven collection that reaches what municipal routes miss.
- **SDG 12 — Responsible Consumption and Production:** waste-type tagging (biodegradable/recyclable/residual) nudges segregation at the source and routes recyclables toward recovery, supporting RA 9003's diversion targets.
- **Governance dividend:** the hotspot dataset gives barangays their first evidence-based view of uncollected waste — a public good produced as exhaust from private transactions.
- **Gender & inclusion note:** a large share of informal waste workers are women ([Eco-Business](https://www.eco-business.com/news/philippines-zero-waste-bid-relies-on-informal-workers/)); verification and in-app payment reduce the safety and non-payment risks they disproportionately bear.

## 9. Competitive Landscape

| Player | What they do | How Kolek differs |
|---|---|---|
| **Status quo** (junk shops, walk-in *magbobote/magbabakal*, informal haulers) | Buy recyclables of value; general waste is ignored | Kolek pays for *removal* of any waste (poster-funded bounty), not just resale value — and adds trust, proof, and tracking |
| **Municipal collection** | Scheduled routes, barangay-dependent | Complementary, not competitive: Kolek handles what routes miss and feeds LGUs the hotspot data |
| **Trash Panda** (Circula Recoon) | On-demand *recyclables* collection in select Metro Manila cities ([BusinessWorld](https://www.bworldonline.com/technology/2021/07/19/383337/recyclable-waste-collection-app-expands-service-to-muntinlupa-and-las-pinas/)) | Recyclables-only, company-managed collectors; Kolek is an open two-sided marketplace covering all waste types, with the credential ladder as the moat |
| **My Basurero / Trash Cash PH / ScrapCycle** | Recyclables-for-points/cash schemes | Incentive programs, not a labor marketplace; no professionalization layer |
| **Generic gig platforms** (e.g., errand apps) | Could list hauling as a task | No waste-specific trust artifacts (before/after proof, waste-type tagging, credential), no LGU data product |

**Defensibility:** the credential is the moat. It is derived from verified in-platform work history, so it cannot be ported to or faked on a competitor; every completed job deepens both the collector's switching cost and the LGU dataset. Network effects are hyper-local (barangay-level density), which favors the first mover that wins a barangay completely rather than a national player spreading thin.

## 10. Roadmap & Milestones (18 months)

| Phase | Months | Milestones |
|---|---|---|
| **1 — Trust foundation** | 1–4 | Identity-verification pipeline (gov ID + selfie); collector onboarding kit; seed 1 pilot barangay; 50 verified collectors |
| **2 — Payment rails** | 4–8 | PayMongo/GCash in-app payments with 12% take rate; instant collector payout; 1,000 cumulative paid pickups |
| **3 — LGU pilot** | 8–13 | Waste-hotspot dashboard v1; 20 barangay subscriptions in pilot city; MOA with city ENRO; RA 9003-aligned reporting |
| **4 — Professionalization** | 13–18 | TESDA-linked certification pathway (unlocks the "Certified" tier); Team Lead tier with crew jobs; PPE program; 8,000 cumulative pickups, 200 active collectors |

Each phase gates the next: no take rate before payments add value; no LGU sales before pickup density makes the dashboard credible; no certification before verification works.

## 11. Team

- **[FILL IN — Founder name]** — [role, background, why you: e.g., built the entire product solo end-to-end — full-stack, design system, security audit]
- **[FILL IN — co-founders/advisers, or state the hiring plan: e.g., seeking a community-operations co-founder with barangay/LGU experience during incubation]**

*[Guidance: TBI panels weight team heavily. If solo, own it — "solo technical founder who shipped a production-grade marketplace; the incubation's first value to me is co-founder matching and LGU introductions." That is a stronger answer than padding.]*

## 12. Funding Ask & Use of Funds

**Ask: ₱4,850,000 over 18 months** — sized within the DOST Startup Grant Fund ceiling of ₱5M per startup ([BusinessWorld](https://bworldonline.com/bw-launchpad/2025/11/12/711513/dost-calls-for-higher-funding-for-startup-law/), [DOST SGF guidelines](https://dost.gov.ph/knowledge-resources/downloads/file/3068-implementing-guidelines-for-the-startup-grant-fund-of-the-department-of-science-and-technology.html)).

| Line item | Amount | Covers |
|---|---|---|
| Personnel (2 FTE: founder-engineer + community ops lead) | ₱2,400,000 | 18 months of build + pilot operations |
| Product engineering & integrations | ₱650,000 | PayMongo/GCash integration, ID-verification vendor fees, LGU dashboard build, native app completion |
| Barangay pilot operations | ₱750,000 | Collector onboarding, training days, PPE starter kits (gloves, boots, vests, sacks), community activation events |
| Certification program development | ₱350,000 | TESDA partnership development, curriculum, assessor fees for first certified cohort |
| Cloud infrastructure & tooling | ₱250,000 | Supabase/Vercel scaling, maps, SMS/notifications, monitoring |
| Marketing & barangay acquisition | ₱250,000 | Hyper-local launches, LGU pitch materials, signage |
| Legal, compliance & registration | ₱200,000 | Business registration, data-privacy (NPC) compliance, MOA templates, payment-facilitation review |
| **Total** | **₱4,850,000** | |

**Ask from the incubator beyond funding:** mentorship on B2G sales, introductions to partner LGUs and TESDA, legal clinic time for the payments/data-privacy review, and co-founder matching.

## 13. Risks & Mitigation

| Risk | Mitigation |
|---|---|
| **Chicken-and-egg liquidity** (no collectors → no posters → no collectors) | Barangay-by-barangay launches with pre-recruited collector cohorts; community feed and leaderboard sustain engagement between jobs; landing page turns "empty board" into a launch call |
| **Off-platform leakage** (parties transact outside the app to avoid the fee) | Take rate only introduced with in-app rails that add real value (instant payout, payment guarantee); the credential only grows from in-app jobs — going off-platform costs the collector career progression |
| **Safety & fraud** (fake cleanups, bad actors) | Before/after photo proof, dual confirmation, dispute branch, ID verification, two-sided ratings; upper tiers require sustained clean history |
| **LGU sales cycles are slow** | Marketplace revenue is independent of B2G; dashboard sold bottom-up at barangay level (₱1,500–5,000/mo is within barangay discretionary spend) before city-level deals |
| **Regulatory** (payment facilitation, data privacy) | Payments via licensed aggregator (PayMongo) rather than holding funds; NPC registration and privacy-by-design (RLS already scopes all personal data); legal review budgeted |
| **Collector welfare optics** (platform accused of extracting from the poor) | Position and price honestly: the 12% funds verification, instant payout, and the certification ladder; publish collector take-home stats; PPE and certification are platform-funded in the pilot |

---

*All product claims in this document describe features that exist in the codebase today unless explicitly marked as roadmap. Market figures are estimates from the cited public sources; pilot projections are assumptions to be validated during incubation.*
