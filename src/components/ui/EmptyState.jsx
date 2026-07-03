// Designed empty state: icon in a soft disc, one-line title, direction, and an
// optional action. An empty screen is an invitation to act, not dead space.
export default function EmptyState({ icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      {icon && (
        <div
          className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-[26px]"
          style={{
            background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
            color: 'var(--brand)',
          }}
        >
          {icon}
        </div>
      )}
      <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      {body && (
        <p className="mt-1 text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {body}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
