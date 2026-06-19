function NavButton({ active, label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-0.5 py-2 transition-all active:scale-95"
      style={{ color: active ? '#0d3320' : '#a8a5a0' }}
      aria-current={active ? 'page' : undefined}
    >
      {children}
      <span className="text-[10px] font-semibold tracking-wide">{label}</span>
    </button>
  )
}

export default function BottomNav({ view, setView, onCompose }) {
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
      <div className="flex items-center px-4">
        <NavButton active={view === 'home'} label="Home" onClick={() => setView('home')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={view === 'home' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
        </NavButton>

        {/* Compose pickup */}
        <div className="flex flex-1 justify-center">
          <button
            onClick={onCompose}
            className="flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              width: 52,
              height: 52,
              marginTop: -18,
              background: '#0d3320',
              color: '#fff',
              boxShadow: '0 6px 16px rgba(13,51,32,0.35)',
            }}
            aria-label="Post a pickup"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <NavButton active={view === 'community'} label="Community" onClick={() => setView('community')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-4.35-9.5-8.5C1 9 2.5 5.5 6 5.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 7C19 16.65 12 21 12 21z" />
          </svg>
        </NavButton>
      </div>
    </nav>
  )
}
