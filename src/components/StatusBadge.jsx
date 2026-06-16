const VARIANT_MAP = {
  Biodegradable: { label: 'Biodegradable', bg: '#eaf5ec', color: '#22863a' },
  Recyclable:    { label: 'Recyclable',    bg: '#e8f0fe', color: '#1966b5' },
  Residual:      { label: 'Residual',      bg: '#fce8e6', color: '#b53419' },
  open:          { label: 'Open',          bg: '#f3f4f2', color: '#a8a5a0' },
  accepted:      { label: 'On the way',   bg: '#fef3e0', color: '#c97f1e' },
  collected:     { label: 'Collected',    bg: '#eaf5ec', color: '#2f6b44' },
  paid:          { label: 'Paid',         bg: '#e6f0eb', color: '#0d3320' },
}

export default function StatusBadge({ variant }) {
  const config = VARIANT_MAP[variant]
  if (!config) {
    return (
      <span
        className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
        style={{ background: '#f3f4f2', color: '#a8a5a0' }}
      >
        {variant ?? '—'}
      </span>
    )
  }
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  )
}
