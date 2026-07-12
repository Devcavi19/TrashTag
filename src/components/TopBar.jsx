function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="mx-auto flex max-w-[430px] items-center justify-between px-4 py-3">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[21px] leading-none" style={{ fontWeight: 600 }}>
            <span style={{ color: 'var(--text-primary)' }}>Ko</span>
            <span style={{ color: 'var(--brand)' }}>lek</span>
          </span>
        </div>
      </div>
    </header>
  )
}

export default TopBar
