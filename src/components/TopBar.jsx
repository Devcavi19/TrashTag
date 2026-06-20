import { useState, useEffect, useRef } from 'react'
import UserMenu from './UserMenu'

function TopBar({ user, stats, onLogout, onNotice }) {
  const initials = user
    ? user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click or Escape while the menu is open
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
    <header
      className="sticky top-0 z-40 w-full"
      style={{ background: '#0d3320' }}
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-display text-[21px] leading-none text-white"
            style={{ fontWeight: 600 }}
          >
            TrashTag
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            PH
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Avatar — opens the account menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all active:scale-95"
              style={{
                background: '#c97f1e',
                color: 'white',
                boxShadow: menuOpen ? '0 0 0 2px #0d3320, 0 0 0 4px #c97f1e' : 'none',
              }}
            >
              {initials}
            </button>

            {menuOpen && (
              <UserMenu
                user={user}
                stats={stats}
                onSignOut={onLogout}
                onNotice={onNotice}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
