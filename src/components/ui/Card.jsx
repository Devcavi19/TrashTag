// Card surface. Border + shadow both come from tokens so light themes get a
// soft shadow and dark themes get a visible border with shadow "none".
export default function Card({ className = '', style, children, ...rest }) {
  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{
        background: 'var(--surface-card)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
