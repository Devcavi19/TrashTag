import { TAG_COLORS } from '../lib/tagColors'
import Chip from './ui/Chip'

// Status palettes ride the theme's semantic tokens: a soft tint of the status
// color for the background, the full color for text — legible on both themes.
const tint = (token) => `color-mix(in srgb, ${token} 14%, transparent)`

const VARIANT_MAP = {
  ...TAG_COLORS,
  open:      { label: 'Open',        bg: tint('var(--text-secondary)'), color: 'var(--text-secondary)' },
  accepted:  { label: 'On the way',  bg: tint('var(--warning)'),        color: 'var(--warning)' },
  collected: { label: 'Collected',   bg: tint('var(--success)'),        color: 'var(--success)' },
  disputed:  { label: 'Needs redo',  bg: tint('var(--danger)'),         color: 'var(--danger)' },
  paid:      { label: 'Paid',        bg: tint('var(--brand)'),          color: 'var(--brand)' },
}

function Badge({ variant }) {
  const config = VARIANT_MAP[variant]
  if (!config) {
    return (
      <Chip bg={tint('var(--text-muted)')} color="var(--text-muted)">
        {variant ?? '—'}
      </Chip>
    )
  }
  return (
    <Chip bg={config.bg} color={config.color}>
      {config.label}
    </Chip>
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
