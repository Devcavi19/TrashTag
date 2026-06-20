import { useState, useEffect, useRef } from 'react'
import UserMenu from './UserMenu'

const FOREST = '#0d3320'
const FAINT = '#a8a5a0'
const AMBER = '#c97f1e'

function NavButton({ active, label, onClick, badge, children }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center gap-0.5 py-2 transition-all active:scale-95"
      style={{ color: active ? FOREST : FAINT }}
      aria-current={active ? 'page' : undefined}
    >
      <span className="relative">
        {children}
        {badge > 0 && (
          <span
            className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
            style={{ background: AMBER }}
          >
            {badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  )
}

export default function BottomNav({
  view,
  setView,
  unreadCount = 0,
  onOpenMessages,
  user,
  stats,
  onLogout,
  onNotice,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the account menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return
    function handlePointer(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2"
      style={{
        background: '#ffffff',
        borderTop: '1px solid #e7e6e2',
        boxShadow: '0 -1px 12px rgba(0,0,0,0.04)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center px-2">
        <NavButton active={view === 'home'} label="Home" onClick={() => setView('home')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={view === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
        </NavButton>

        <NavButton active={view === 'community'} label="Community" onClick={() => setView('community')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={view === 'community' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </NavButton>

        {/* Messages — the raised center action, badged with active conversations */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={onOpenMessages}
            className="relative flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              width: 52,
              height: 52,
              marginTop: -18,
              background: FOREST,
              color: '#fff',
              boxShadow: '0 6px 16px rgba(13,51,32,0.35)',
            }}
            aria-label="Messages"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ background: AMBER, boxShadow: '0 0 0 2px #fff' }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <NavButton active={view === 'leaderboard'} label="Board" onClick={() => setView('leaderboard')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={view === 'leaderboard' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 21h8M12 17v4M6 4h12v4a6 6 0 0 1-12 0z" /><path d="M18 5h2a2 2 0 0 1 0 4h-1M6 5H4a2 2 0 0 0 0 4h1" />
          </svg>
        </NavButton>

        {/* Account — replaces the old Inbox slot; opens the menu upward */}
        <div className="relative flex flex-1 justify-center" ref={menuRef}>
          <NavButton
            active={menuOpen}
            label="You"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={menuOpen ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
          </NavButton>

          {menuOpen && (
            <UserMenu
              user={user}
              stats={stats}
              onSignOut={onLogout}
              onNotice={onNotice}
              onClose={() => setMenuOpen(false)}
              placement="top"
            />
          )}
        </div>
      </div>
    </nav>
  )
}
