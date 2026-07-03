const SIZES = { sm: 28, md: 36, lg: 56 }

// Avatar with initials fallback. Hue is derived from the name so the same
// person always gets the same disc color.
export default function Avatar({ name = '', src, size = 'md', className = '', style }) {
  const px = SIZES[size] ?? size
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
        style={{ width: px, height: px, ...style }}
      />
    )
  }

  let hue = 0
  for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold select-none ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: px * 0.38,
        background: `oklch(0.55 0.09 ${hue})`,
        color: '#ffffff',
        ...style,
      }}
      aria-label={name}
    >
      {initials || '?'}
    </span>
  )
}
