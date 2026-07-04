// Dev-only component preview harness, served at /preview.html by the dev
// server (never part of the production build — vite only builds index.html).
// Renders shell + screens with fixture data so redesigns can be verified
// visually without a live Supabase backend.
// Usage: /preview.html?screen=shell&theme=bold-impact
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

const params = new URLSearchParams(location.search)
const screen = params.get('screen') || 'shell'
applyTheme(params.get('theme') || 'fresh-canopy')

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
          body="Post the first one and a collector will come running."
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
  { id: 'u-herald', name: 'Herald' },
  { id: 'u-carl', name: 'Carl Avila' },
  { id: 'u-juana', name: 'Juana Reyes' },
]

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
          onNotice={() => {}}
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
      request={FIXTURE_HISTORY.find((r) => r.id === 'r5')}
      currentUser={FIXTURE_USER}
      users={FIXTURE_USERS}
      onClose={() => {}}
      onUpdateStatus={() => {}}
      onSubmitAfterPhoto={() => {}}
      onPayment={() => {}}
      onRate={() => {}}
    />
  ),
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{SCREENS[screen] ?? SCREENS.shell}</StrictMode>,
)
