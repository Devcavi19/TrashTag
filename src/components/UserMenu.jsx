// The avatar dropdown: a "field record" card grounded in real request activity.
// Rendered by TopBar inside a relative wrapper; TopBar owns open/close state.

const FOREST = '#0d3320'
const AMBER = '#c97f1e'
const INK = '#1c1c1e'
const MUTED = '#706d67'
const LINE = '#e7e6e2'

// Your title is what you've done, not a setting — derive it from the ledger.
function deriveTitle({ posted, collected }) {
  if (collected > 0 && collected >= posted) return 'Collector'
  if (posted > 0) return 'Poster'
  return 'New member'
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 py-3">
      <span className="font-display text-[22px] leading-none" style={{ color: FOREST, fontWeight: 600 }}>
        {value}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  )
}

function Item({ icon, label, onClick, danger = false }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-semibold transition-colors"
      style={{ color: danger ? '#b53419' : INK, background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f2')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center" style={{ color: danger ? '#b53419' : MUTED }}>
        {icon}
      </span>
      {label}
    </button>
  )
}

export default function UserMenu({ user, stats, onSignOut, onNotice, onClose, placement = 'bottom' }) {
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  const title = deriveTitle(stats)
  const rating = stats.ratingCount > 0 ? stats.rating.toFixed(1) : '—'
  const anchor = placement === 'top' ? 'bottom-full mb-3' : 'top-12'

  return (
    <div
      role="menu"
      aria-label="Account menu"
      data-placement={placement}
      className={`usermenu-pop absolute right-0 ${anchor} z-50 w-[272px] overflow-hidden rounded-2xl`}
      style={{ background: '#fff', border: `1px solid ${LINE}`, boxShadow: '0 14px 40px rgba(13,51,32,0.22)' }}
    >
      {/* Identity band — continues the TopBar's forest green */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ background: FOREST }}>
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: AMBER, color: '#fff' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="font-display text-[16px] leading-tight text-white" style={{ fontWeight: 600 }}>
            {user?.name || 'You'}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
              style={{ background: 'rgba(201,127,30,0.22)', color: '#e8b878' }}
            >
              {title}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              TrashTag PH
            </span>
          </div>
        </div>
      </div>

      {/* Field record — real numbers from live requests */}
      <div style={{ background: '#fbfbfa', borderBottom: `1px solid ${LINE}` }}>
        <p className="px-4 pt-3 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: '#a8a5a0' }}>
          Field record
        </p>
        <div className="flex items-stretch px-2">
          <Stat value={stats.posted} label="Posted" />
          <span className="my-3 w-px self-stretch" style={{ background: LINE }} />
          <Stat value={stats.collected} label="Collected" />
          <span className="my-3 w-px self-stretch" style={{ background: LINE }} />
          <Stat value={rating} label="Rating" />
        </div>
      </div>

      {/* Actions */}
      <div className="py-1">
        <Item
          label="Account settings"
          onClick={() => { onClose(); onNotice('Account settings are coming soon.') }}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          }
        />
        <Item
          label="Community guidelines"
          onClick={() => { onClose(); onNotice('Community guidelines are coming soon.') }}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
        <div className="my-1 h-px" style={{ background: LINE }} />
        <Item
          danger
          label="Sign out"
          onClick={() => { onClose(); onSignOut() }}
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
            </svg>
          }
        />
      </div>
    </div>
  )
}
