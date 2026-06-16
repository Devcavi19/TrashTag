function TopBar({ role, setRole }) {
  return (
    <header
      style={{ backgroundColor: '#1a472a' }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-white">TrashTag</span>

        <div
          style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          className="flex rounded-full p-1"
        >
          {['poster', 'collector'].map((option) => (
            <button
              key={option}
              onClick={() => setRole(option)}
              style={
                role === option
                  ? { backgroundColor: '#ffffff', color: '#1a472a' }
                  : { backgroundColor: 'transparent', color: '#ffffff' }
              }
              className="rounded-full px-4 py-1 text-sm font-medium capitalize transition-colors"
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

export default TopBar
