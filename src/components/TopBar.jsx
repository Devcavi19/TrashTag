function TopBar({ role, setRole, openCount, user, onLogout }) {
  const initials = user
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{ background: '#0d3320' }}
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-bold tracking-tight text-white">TrashTag</span>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            PH
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex rounded-full p-0.5"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            {[
              { key: 'poster', label: 'Post' },
              { key: 'collector', label: 'Collect' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRole(key)}
                className="rounded-full px-4 py-1 text-sm font-semibold transition-all"
                style={
                  role === key
                    ? { background: '#ffffff', color: '#0d3320' }
                    : { background: 'transparent', color: 'rgba(255,255,255,0.6)' }
                }
              >
                <span>{label}</span>
                {key === 'collector' && openCount > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Avatar + logout */}
          <button
            onClick={onLogout}
            title={`Logout (${user?.name})`}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: '#c97f1e', color: 'white' }}
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  )
}

export default TopBar
