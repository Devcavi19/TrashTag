// Dev-only component preview harness, served at /preview.html by the dev
// server (never part of the production build — vite only builds index.html).
// Renders shell + screens with fixture data so redesigns can be verified
// visually without a live Supabase backend.
// Usage: /preview.html?screen=shell&theme=bold-impact
// Screens: shell|cards|sheet|feed|profile|board|inbox|pay|confirmpay|thread|credential|settings|notifprefs|guidelines|dispatchhome|radar|offer
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { applyTheme } from '../lib/themes'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import TrashCard from '../components/TrashCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Chip from '../components/ui/Chip'
import { Input, TextArea } from '../components/ui/Input'
import Sheet from '../components/ui/Sheet'
import EmptyState from '../components/ui/EmptyState'
import Avatar from '../components/ui/Avatar'
import { TAG_COLORS } from '../lib/tagColors'
import FeedView from '../components/FeedView'
import ProfileView from '../components/ProfileView'
import LeaderboardView from '../components/LeaderboardView'
import Conversations from '../components/Conversations'
import MessageThread from '../components/MessageThread'
import { PaySheet, ConfirmPaymentSheet } from '../components/PaymentSheet'
import GuidelinesSheet from '../components/GuidelinesSheet'
import AccountSheet from '../components/AccountSheet'
import NotificationsSheet from '../components/NotificationsSheet'
import CollectorCredential from '../components/CollectorCredential'
import CredentialSheet from '../components/CredentialSheet'
import { deriveCredential } from '../lib/collectorCred'
import HomeFeed from '../components/HomeFeed'
import DispatchRadar from '../components/DispatchRadar'
import IncomingOffer from '../components/IncomingOffer'

const params = new URLSearchParams(location.search)
const screen = params.get('screen') || 'shell'
applyTheme(params.get('theme') || 'eco-premium')

const FIXTURE_USER = { id: 'u-herald', name: 'Herald' }

const FIXTURE_REQUESTS = [
  {
    id: 'r1',
    photo: null,
    tags: ['Recyclable', 'Mixed'],
    status: 'open',
    gps: 'Brgy. Mabolo, Cebu City',
    price: 150,
    postedAt: new Date(Date.now() - 3600e3).toISOString(),
    likes: ['u-carl'],
    postedBy: 'u-carl',
    collectedBy: null,
  },
  {
    id: 'r2',
    photo: null,
    tags: ['Biodegradable'],
    status: 'accepted',
    gps: 'Riverside, Brgy. Talamban',
    price: 220,
    postedAt: new Date(Date.now() - 7200e3).toISOString(),
    likes: [],
    postedBy: 'u-herald',
    collectedBy: 'u-carl',
  },
]

const FIXTURE_POSTS = [
  {
    id: 'p1',
    type: 'event',
    authorName: 'Carl Avila',
    title: 'Coastal cleanup drive — Mactan shoreline',
    body: 'Gloves and sacks provided. Meet at the lighthouse parking lot; barangay truck hauls everything at noon.',
    photoUrl: null,
    eventDate: '2026-07-12',
    eventLocation: 'Punta Engaño, Lapu-Lapu',
    createdAt: new Date(Date.now() - 5400e3).toISOString(),
    externalUrl: 'https://example.com',
    likes: ['u-herald'],
  },
  {
    id: 'p2',
    type: 'news',
    authorName: 'Herald',
    title: 'City doubles MRF capacity in Talamban',
    body: 'The new materials recovery facility accepts segregated recyclables daily from 7am.',
    photoUrl: null,
    createdAt: new Date(Date.now() - 86400e3).toISOString(),
    likes: [],
  },
  {
    id: 'p3',
    type: 'post',
    authorName: 'Juana Reyes',
    title: null,
    body: 'Tip: rinse tetra packs before bagging them — collectors get a better rate at the junk shop. 🌱',
    photoUrl: null,
    createdAt: new Date(Date.now() - 200e3).toISOString(),
    likes: ['u-herald', 'u-carl'],
  },
]

function Primitives() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="ink">Ink</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Saving</Button>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(TAG_COLORS).map(([k, v]) => (
            <Chip key={k} bg={v.bg} color={v.color}>{v.label}</Chip>
          ))}
          <Chip onClick={() => {}} selected>Nearby</Chip>
          <Chip onClick={() => {}}>Open</Chip>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <Input label="Email" placeholder="you@example.com" />
          <Input label="Price" error="Enter an amount above ₱0." defaultValue="0" />
          <TextArea label="Notes" hint="Visible to collectors." placeholder="3 bags near the gate" />
        </div>
      </Card>
      <Card>
        <EmptyState
          icon="🧹"
          title="No pickups nearby yet"
          body="Post the first one and a Green Collector will come running."
          action={<Button>Post a pickup</Button>}
        />
      </Card>
      <div className="flex items-center gap-3 px-2">
        <Avatar name="Herald Carl" size="lg" />
        <Avatar name="Carl Avila" />
        <Avatar name="Juana" size="sm" />
      </div>
      <div className="tt-skeleton h-24 w-full" />
    </div>
  )
}

function SheetPreview() {
  return (
    <Sheet open title="Confirm pickup" onClose={() => {}}>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        You commit to collecting this trash and opening a conversation with the poster.
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" full>Cancel</Button>
        <Button full>Accept pickup</Button>
      </div>
    </Sheet>
  )
}

const FIXTURE_USERS = [
  { id: 'u-herald', name: 'Herald', verified_at: '2026-05-02T08:00:00Z', created_at: '2026-03-14T08:00:00Z' },
  { id: 'u-carl', name: 'Carl Avila', verified_at: '2026-04-11T08:00:00Z', created_at: '2026-02-02T08:00:00Z' },
  { id: 'u-juana', name: 'Juana Reyes', verified_at: null, created_at: '2026-06-20T08:00:00Z' },
  { id: 'u-ramon', name: 'Mang Ramon', verified_at: '2025-12-01T08:00:00Z', created_at: '2025-11-20T08:00:00Z' },
]

// Mang Ramon's settled jobs — enough paid pickups at a high rating to earn
// the Top-Rated rung, so the ladder renders fully lit in previews.
const RAMON_JOBS = Array.from({ length: 24 }, (_, i) => ({
  id: `ramon-${i}`,
  photo: null,
  tags: ['Mixed'],
  status: 'paid',
  gps: 'Brgy. Mabolo, Cebu City',
  price: 120,
  postedAt: new Date(Date.now() - (i + 10) * 86400e3).toISOString(),
  likes: [],
  postedBy: 'u-juana',
  collectedBy: 'u-ramon',
  rating: i % 8 === 0 ? 4 : 5,
}))

const FIXTURE_HISTORY = [
  ...FIXTURE_REQUESTS,
  {
    id: 'r3',
    photo: null,
    tags: ['Residual', 'Biodegradable'],
    status: 'paid',
    gps: 'Sitio Riverside, Talamban',
    price: 180,
    postedAt: new Date(Date.now() - 3 * 86400e3).toISOString(),
    likes: [],
    postedBy: 'u-herald',
    collectedBy: 'u-carl',
    rating: 5,
    collectorRating: 4,
  },
  {
    id: 'r4',
    photo: null,
    tags: ['Recyclable'],
    status: 'paid',
    gps: 'Brgy. Apas, Cebu City',
    price: 95,
    postedAt: new Date(Date.now() - 6 * 86400e3).toISOString(),
    likes: [],
    postedBy: 'u-juana',
    collectedBy: 'u-herald',
    rating: 4,
  },
  {
    id: 'r5',
    photo: null,
    tags: ['Mixed'],
    status: 'collected',
    gps: 'Brgy. Lahug, Cebu City',
    price: 260,
    postedAt: new Date(Date.now() - 86400e3).toISOString(),
    likes: [],
    postedBy: 'u-herald',
    collectedBy: 'u-carl',
    afterPhoto: null,
    lat: 10.33,
    lng: 123.9,
  },
]

const FIXTURE_STATS = { posted: 3, collected: 1, ratingCount: 1, rating: 4 }

// Same lookup App provides: profile row + derived Green Collector credential.
const CRED_REQUESTS = [...FIXTURE_HISTORY, ...RAMON_JOBS]
function credentialFor(userId) {
  const profile = FIXTURE_USERS.find((u) => u.id === userId)
  return profile ? { profile, credential: deriveCredential(CRED_REQUESTS, profile) } : null
}

const SCREENS = {
  shell: (
    <>
      <TopBar />
      <div className="flex-1 p-4">
        <Primitives />
      </div>
      <BottomNav view="home" setView={() => {}} unreadCount={3} onOpenMessages={() => {}} />
    </>
  ),
  cards: (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col gap-3 p-4 pb-24">
        {FIXTURE_REQUESTS.map(r => (
          <TrashCard
            key={r.id}
            request={r}
            currentUserId={FIXTURE_USER.id}
            onAccept={() => {}}
            onLike={() => {}}
            onOpenThread={() => {}}
            credentialFor={credentialFor}
            distanceMeters={r.id === 'r1' ? 1200 : 480}
          />
        ))}
      </div>
      <BottomNav view="home" setView={() => {}} onOpenMessages={() => {}} />
    </>
  ),
  sheet: <SheetPreview />,
  feed: (
    <>
      <TopBar />
      <div className="flex-1 pb-24">
        <FeedView posts={FIXTURE_POSTS} addPost={() => {}} onLike={() => {}} currentUser={FIXTURE_USER} />
      </div>
      <BottomNav view="community" setView={() => {}} onOpenMessages={() => {}} />
    </>
  ),
  profile: (
    <>
      <TopBar />
      <div className="flex-1 pb-24">
        <ProfileView
          currentUser={{ ...FIXTURE_USER, email: 'herald@example.com', created_at: '2026-03-14' }}
          requests={FIXTURE_HISTORY}
          stats={FIXTURE_STATS}
          onLogout={() => {}}
          onUploadAvatar={async () => {}}
          onSaveName={async () => {}}
          onChangeEmail={async () => {}}
          onChangePassword={async () => {}}
          notificationPrefs={{ jobUpdates: true, messages: true, community: true }}
          onSaveNotificationPrefs={async () => true}
          credentialFor={credentialFor}
          theme={new URLSearchParams(location.search).get('theme') || 'fresh-canopy'}
          onThemeChange={() => {}}
        />
      </div>
      <BottomNav view="you" setView={() => {}} onOpenMessages={() => {}} />
    </>
  ),
  board: (
    <>
      <TopBar />
      <div className="flex-1 pb-24">
        <LeaderboardView requests={FIXTURE_HISTORY} users={FIXTURE_USERS} currentUser={FIXTURE_USER} />
      </div>
      <BottomNav view="leaderboard" setView={() => {}} onOpenMessages={() => {}} />
    </>
  ),
  inbox: (
    <Conversations
      requests={FIXTURE_HISTORY}
      currentUser={FIXTURE_USER}
      users={FIXTURE_USERS}
      onClose={() => {}}
      onOpenThread={() => {}}
    />
  ),
  pay: (
    <PaySheet
      open
      onClose={() => {}}
      request={FIXTURE_HISTORY.find((r) => r.id === 'r5')}
      collectorProfile={{ id: 'u-carl', name: 'Carl Avila', gcash_number: '0917 555 0123', maya_number: null }}
      onMarkSent={() => {}}
    />
  ),
  confirmpay: (
    <ConfirmPaymentSheet
      open
      onClose={() => {}}
      request={{
        ...FIXTURE_HISTORY.find((r) => r.id === 'r5'),
        paymentMethod: 'gcash',
        paymentReference: '9021 3456 7890',
        paymentSentAt: new Date().toISOString(),
      }}
      posterName="Herald"
      onConfirm={() => {}}
      onNotReceived={() => {}}
    />
  ),
  thread: (
    <MessageThread
      requests={FIXTURE_HISTORY.filter(
        (r) =>
          r.status !== 'open' &&
          ((r.postedBy === 'u-herald' && r.collectedBy === 'u-carl') ||
            (r.collectedBy === 'u-herald' && r.postedBy === 'u-carl'))
      )}
      counterpartId="u-carl"
      currentUser={FIXTURE_USER}
      users={FIXTURE_USERS}
      onClose={() => {}}
      onUpdateStatus={() => {}}
      onSubmitAfterPhoto={() => {}}
      onRejectProof={() => {}}
      onMarkPaymentSent={() => {}}
      onConfirmPaymentReceived={() => {}}
      onPaymentNotReceived={() => {}}
      onRate={() => {}}
      credentialFor={credentialFor}
    />
  ),
  guidelines: <GuidelinesSheet open onClose={() => {}} />,
  notifprefs: (
    <NotificationsSheet
      open
      onClose={() => {}}
      prefs={{ jobUpdates: true, messages: true, community: false }}
      onSave={async () => true}
    />
  ),
  settings: (
    <AccountSheet
      open
      onClose={() => {}}
      currentUser={{ ...FIXTURE_USER, email: 'herald@example.com' }}
      profile={{ id: 'u-herald', name: 'Herald', avatar_url: null }}
      onUploadAvatar={async () => {}}
      onSaveName={async () => {}}
      onChangeEmail={async () => {}}
      onChangePassword={async () => {}}
    />
  ),
  credential: (
    <>
      <TopBar />
      <div className="flex flex-1 flex-col gap-3 p-4 pb-24">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Trust lines — top-rated / verified / unverified
        </p>
        <CollectorCredential {...credentialFor('u-ramon')} />
        <CollectorCredential {...credentialFor('u-carl')} />
        <CollectorCredential {...credentialFor('u-juana')} />
        <CredentialSheet open onClose={() => {}} {...credentialFor('u-ramon')} />
      </div>
      <BottomNav view="home" setView={() => {}} onOpenMessages={() => {}} />
    </>
  ),
  dispatchhome: (
    <>
      <TopBar />
      <div className="flex-1 pb-24">
        <HomeFeed
          requests={FIXTURE_REQUESTS}
          currentUser={FIXTURE_USER}
          onCompose={() => {}}
          onAccept={() => {}}
          onLike={() => {}}
          onOpenThread={() => {}}
          credentialFor={credentialFor}
          online={true}
          setOnline={() => {}}
          location={{ latitude: 10.32, longitude: 123.90 }}
          onOpenDispatchRadar={() => {}}
        />
      </div>
      <BottomNav view="home" setView={() => {}} onOpenMessages={() => {}} />
    </>
  ),
  radar: (
    <>
      <TopBar />
      <div className="fixed inset-0 z-[200] bg-[var(--surface)] max-w-[430px] mx-auto overflow-hidden flex flex-col">
        <div className="flex items-center p-4 border-b border-[var(--border)] bg-[var(--surface-card)]">
          <button className="tt-press p-2 -ml-2 text-[var(--text-secondary)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 className="font-bold flex-1 text-center pr-6 text-[17px]">Dispatch Radar</h2>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <DispatchRadar
            request={FIXTURE_REQUESTS[0]}
            onCancel={() => {}}
            onAcceptOffer={() => {}}
            onDeclineOffer={() => {}}
          />
        </div>
      </div>
    </>
  ),
  offer: (
    <IncomingOffer
      request={FIXTURE_REQUESTS[0]}
      poster={FIXTURE_USERS.find(u => u.id === FIXTURE_REQUESTS[0].postedBy)}
      credentialFor={credentialFor}
      distanceMeters={1200}
      onAccept={() => {}}
      onPass={() => {}}
      onCounter={() => {}}
    />
  ),
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{SCREENS[screen] ?? SCREENS.shell}</StrictMode>,
)
