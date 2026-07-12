// The Kolek app mark — the same drop glyph as public/favicon.svg (and
// public/icons.svg), minus the gradient tile so it can sit inside any
// container and inherit its color. The drop fills with currentColor; the
// subtle vein tracks --brand-ink to match the favicon. Geometry (viewBox +
// transform) is copied verbatim from the favicon so the two never drift.
export default function BrandMark({ size = 44, className, style, title = 'Kolek' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      role="img"
      aria-label={title}
      className={className}
      style={style}
    >
      <g transform="translate(262,192) scale(5)">
        <path
          d="M50 115 C 27 87 14 69 14 48 C 14 26 30 11 50 11 C 70 11 86 26 86 48 C 86 69 73 87 50 115 Z"
          fill="currentColor"
        />
        <path
          d="M50 13 C 45 44 45 74 50 113"
          fill="none"
          stroke="var(--brand-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.22"
        />
      </g>
    </svg>
  )
}
