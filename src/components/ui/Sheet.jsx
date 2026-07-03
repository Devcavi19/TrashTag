import { useEffect } from 'react'

// Bottom sheet — the app's single modal idiom. Scrim click and Escape close;
// panel stays inside the 430px shell. Becomes the base for the payment flow.
export default function Sheet({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="tt-scrim fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.45)' }}
      onClick={onClose}
    >
      <div
        className="tt-sheet w-full max-w-[430px] px-4 pb-4"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="max-h-[85svh] overflow-y-auto"
          style={{
            background: 'var(--surface-raised)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-raised)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="mx-auto mt-2.5 h-1 w-9 rounded-full"
            style={{ background: 'var(--border)' }}
          />
          {title && (
            <h3
              className="px-5 pt-3 text-[16px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h3>
          )}
          <div className="px-5 pb-5 pt-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
