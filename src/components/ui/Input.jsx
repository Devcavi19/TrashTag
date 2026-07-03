// Text inputs with label + inline error. Focus/invalid states live on the
// .tt-input class in index.css (inline styles can't express :focus).

function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-[12px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium" style={{ color: 'var(--danger)' }}>
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      ) : null}
    </label>
  )
}

export function Input({ label, error, hint, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        className={`tt-input w-full px-3.5 py-2.5 text-sm ${className}`}
        data-invalid={Boolean(error)}
        {...rest}
      />
    </Field>
  )
}

export function TextArea({ label, error, hint, rows = 3, className = '', ...rest }) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea
        className={`tt-input w-full resize-none px-3.5 py-2.5 text-sm ${className}`}
        data-invalid={Boolean(error)}
        rows={rows}
        {...rest}
      />
    </Field>
  )
}
