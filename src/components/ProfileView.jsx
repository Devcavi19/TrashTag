// The "You" section — a full-screen field record, not a dropdown. Everything
// here is derived from live requests; nothing is a vanity number.
import { TAG_COLORS } from '../lib/tagColors'

const FOREST = '#0d3320'
const AMBER = '#c97f1e'
const INK = '#1c1c1e'
const MUTED = '#706d67'
const FAINT = '#a8a5a0'
const LINE = '#e7e6e2'

const CATEGORIES = Object.keys(TAG_COLORS) // canonical order: Bio / Recyclable / Residual / Mixed

// Your title is what you've done, not a setting.
function deriveTitle({ posted, collected }) {
  if (collected > 0 && collected >= posted) return 'Collector'
  if (posted > 0) return 'Poster'
  return 'New member'
}

function initialsOf(name) {
  return name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?'
}

function memberSince(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString([], { month: 'long', year: 'numeric' })
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 py-3.5">
      <span className="font-display text-[24px] leading-none" style={{ color: FOREST, fontWeight: 600 }}>
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  )
}

function ActionRow({ icon, label, hint, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f7f7f6')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center" style={{ color: danger ? '#b53419' : MUTED }}>
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-semibold" style={{ color: danger ? '#b53419' : INK }}>
        {label}
      </span>
      {hint && (
        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ background: '#f3f4f2', color: FAINT }}>
          {hint}
        </span>
      )}
      {!danger && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8c5c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </button>
  )
}

export default function ProfileView({ currentUser, requests, stats, onLogout, onNotice }) {
  const myId = currentUser?.id
  const title = deriveTitle(stats)
  const rating = stats.ratingCount > 0 ? stats.rating.toFixed(1) : '—'
  const since = memberSince(currentUser?.created_at)

  // Real money moved: what you've paid out as a poster + earned as a collector.
  const completedMine = requests.filter(
    (r) => (r.postedBy === myId || r.collectedBy === myId) && ['collected', 'paid'].includes(r.status)
  )
  const earned = requests
    .filter((r) => r.collectedBy === myId && r.status === 'paid')
    .reduce((sum, r) => sum + (Number(r.price) || 0), 0)

  // Cleanup composition — tally the trash categories you've helped clear.
  const tally = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const r of completedMine) {
    for (const tag of r.tags || []) {
      if (tag in tally) tally[tag] += 1
    }
  }
  const totalTags = CATEGORIES.reduce((s, c) => s + tally[c], 0)
  const segments = CATEGORIES.filter((c) => tally[c] > 0)

  return (
    <div className="pb-6">
      {/* Identity hero — continues the brand's forest green */}
      <div className="px-4 pb-5 pt-5" style={{ background: FOREST }}>
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ background: AMBER, boxShadow: '0 4px 14px rgba(201,127,30,0.4)' }}
          >
            {initialsOf(currentUser?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[22px] leading-tight text-white" style={{ fontWeight: 600 }}>
              {currentUser?.name || 'You'}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{ background: 'rgba(201,127,30,0.22)', color: '#e8b878' }}
              >
                {title}
              </span>
              {since && (
                <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Member since {since}
                </span>
              )}
            </div>
          </div>
        </div>
        {currentUser?.email && (
          <p className="mt-3 truncate text-[12px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {currentUser.email}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Impact ledger */}
        <section className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <p className="px-4 pt-3 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: FAINT }}>
            Impact ledger
          </p>
          <div className="flex items-stretch px-1">
            <Stat value={stats.posted} label="Posted" />
            <span className="my-3.5 w-px self-stretch" style={{ background: LINE }} />
            <Stat value={stats.collected} label="Collected" />
            <span className="my-3.5 w-px self-stretch" style={{ background: LINE }} />
            <Stat value={`₱${earned}`} label="Earned" />
            <span className="my-3.5 w-px self-stretch" style={{ background: LINE }} />
            <Stat value={rating} label="Rating" />
          </div>
        </section>

        {/* Cleanup record — the signature: real trash categories you've cleared */}
        <section className="rounded-2xl bg-white p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <h2 className="font-display text-[15px]" style={{ color: FOREST, fontWeight: 600 }}>
            What you've helped clear
          </h2>

          {totalTags === 0 ? (
            <p className="mt-2 text-[13px]" style={{ color: FAINT }}>
              No pickups completed yet. Post a job or collect one, and the trash you clear shows up here by type.
            </p>
          ) : (
            <>
              <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full" style={{ background: '#f3f4f2' }}>
                {segments.map((c) => (
                  <div
                    key={c}
                    style={{ width: `${(tally[c] / totalTags) * 100}%`, background: TAG_COLORS[c].color }}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-2">
                {segments.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: TAG_COLORS[c].color }} />
                    <span className="text-[12px] font-medium" style={{ color: INK }}>{TAG_COLORS[c].label}</span>
                    <span className="text-[12px] font-bold" style={{ color: MUTED }}>{tally[c]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Account actions */}
        <section className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <ActionRow
            label="Account settings"
            hint="Soon"
            onClick={() => onNotice('Account settings are coming soon.')}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
          />
          <div className="h-px" style={{ background: LINE }} />
          <ActionRow
            label="Notifications"
            hint="Soon"
            onClick={() => onNotice('Notification settings are coming soon.')}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            }
          />
          <div className="h-px" style={{ background: LINE }} />
          <ActionRow
            label="Community guidelines"
            hint="Soon"
            onClick={() => onNotice('Community guidelines are coming soon.')}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />
        </section>

        <section className="overflow-hidden rounded-2xl bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
          <ActionRow
            danger
            label="Sign out"
            onClick={onLogout}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
              </svg>
            }
          />
        </section>

        <p className="pt-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: '#c8c5c0' }}>
          TrashTag PH
        </p>
      </div>
    </div>
  )
}
