import { TAG_COLORS } from '../lib/tagColors'

const VARIANT_MAP = {
  ...TAG_COLORS,
  open:          { label: 'Open',          bg: '#f3f4f2', color: '#a8a5a0' },
  accepted:      { label: 'On the way',   bg: '#fef3e0', color: '#c97f1e' },
  collected:     { label: 'Collected',    bg: '#eaf5ec', color: '#2f6b44' },
  paid:          { label: 'Paid',         bg: '#e6f0eb', color: '#0d3320' },
}

function Badge({ variant }) {
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

// `variant` may be a single value or an array of tag values (renders one badge each).
export default function StatusBadge({ variant }) {
  if (Array.isArray(variant)) {
    return (
      <>
        {variant.map((v) => (
          <Badge key={v} variant={v} />
        ))}
      </>
    )
  }
  return <Badge variant={variant} />
}
