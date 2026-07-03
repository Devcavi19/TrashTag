import { useEffect } from 'react'
import Sheet from './ui/Sheet'
import Button from './ui/Button'

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
      if (e.key === 'Enter') onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pt-1 text-center">
        <div
          className="mx-auto mb-3 flex items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            background: 'color-mix(in srgb, var(--success) 14%, transparent)',
            color: 'var(--success)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mb-1.5 text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        {message && (
          <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
            {message}
          </p>
        )}
        <Button full className="mt-5" onClick={onClose}>
          {buttonLabel}
        </Button>
      </div>
    </Sheet>
  )
}

export default SuccessModal
