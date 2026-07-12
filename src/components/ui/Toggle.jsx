// Switch row: label + optional sub-label on the left, pill switch on the
// right. Purely controlled — parent owns the value and persistence.
export default function Toggle({ checked, onChange, label, sub }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 py-3 text-left"
      style={{ background: 'transparent' }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        {sub && (
          <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className="relative inline-flex h-[26px] w-[46px] flex-shrink-0 items-center rounded-full"
        style={{
          background: checked
            ? 'var(--brand)'
            : 'color-mix(in srgb, var(--text-primary) 18%, transparent)',
          transition: 'background 0.18s ease',
        }}
      >
        <span
          className="tt-toggle-knob absolute h-[20px] w-[20px] rounded-full"
          style={{
            background: 'var(--surface-card)',
            transform: checked ? 'translateX(23px)' : 'translateX(3px)',
            boxShadow: 'var(--shadow-card)',
          }}
        />
      </span>
    </button>
  )
}
