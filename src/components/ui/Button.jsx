// Token-styled button. Variants map to token pairs; never hardcode hex here.
const VARIANTS = {
  primary: { background: 'var(--brand)', color: 'var(--on-brand)' },
  ink: { background: 'var(--brand-ink)', color: 'var(--on-brand-ink)' },
  secondary: {
    background: 'color-mix(in srgb, var(--text-primary) 7%, transparent)',
    color: 'var(--text-primary)',
  },
  ghost: { background: 'transparent', color: 'var(--text-secondary)' },
  danger: { background: 'var(--danger)', color: 'var(--on-brand)' },
}

const SIZES = {
  md: 'text-sm font-semibold py-2.5 px-4',
  sm: 'text-[13px] font-semibold py-1.5 px-3',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  disabled = false,
  className = '',
  style,
  children,
  ...rest
}) {
  return (
    <button
      className={`tt-press inline-flex items-center justify-center gap-1.5 ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      style={{ borderRadius: 'var(--radius-control)', ...VARIANTS[variant], ...style }}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      )}
      {children}
    </button>
  )
}
