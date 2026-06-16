import { useEffect } from 'react'

function SuccessModal({
  open,
  title = 'Success!',
  message,
  buttonLabel = 'Done',
  onClose,
}) {
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xs overflow-hidden text-center"
        style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-6 pb-5">
          <div
            className="mx-auto mb-3 flex items-center justify-center rounded-full"
            style={{ width: 52, height: 52, background: '#eaf5ec' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2f6b44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold mb-1.5" style={{ color: '#1c1c1e' }}>
            {title}
          </h3>
          {message && (
            <p className="text-sm leading-snug" style={{ color: '#706d67' }}>
              {message}
            </p>
          )}
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: '#0d3320' }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal
