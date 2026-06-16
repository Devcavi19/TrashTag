import { useEffect } from 'react'

function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = '#0d3320',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs overflow-hidden"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5">
          <h3 className="text-[16px] font-bold mb-1.5" style={{ color: '#1c1c1e' }}>
            {title}
          </h3>
          {message && (
            <p className="text-sm leading-snug" style={{ color: '#706d67' }}>
              {message}
            </p>
          )}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: '#f0efec', color: '#1c1c1e' }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: confirmColor }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
