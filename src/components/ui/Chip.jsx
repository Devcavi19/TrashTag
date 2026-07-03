// Small pill for tags, filters, and status. Interactive when onClick is set:
// selected chips fill with brand ink, idle ones stay quiet.
export default function Chip({
  selected = false,
  bg,
  color,
  size = 'md',
  className = '',
  style,
  children,
  onClick,
  ...rest
}) {
  const sizing = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'
  const palette = onClick
    ? selected
      ? { background: 'var(--brand-ink)', color: 'var(--on-brand-ink)' }
      : {
          background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
          color: 'var(--text-secondary)',
        }
    : {
        background: bg ?? 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
        color: color ?? 'var(--text-secondary)',
      }

  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      className={`${onClick ? 'tt-press ' : ''}inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${sizing} ${className}`}
      style={{ ...palette, ...style }}
      onClick={onClick}
      {...(onClick ? { 'aria-pressed': selected } : {})}
      {...rest}
    >
      {children}
    </Tag>
  )
}
