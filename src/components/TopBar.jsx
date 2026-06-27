function TopBar() {
  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{ background: '#0d3320' }}
    >
      <div className="mx-auto flex max-w-[430px] items-center px-4 py-3">
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
      </div>
    </header>
  )
}

export default TopBar
