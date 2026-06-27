import { useEffect } from 'react'
import PostForm from './PostForm'

export default function ComposerModal({ onClose, onSubmit }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-t-2xl"
        style={{ maxWidth: 430, maxHeight: '92vh', background: '#f3f4f2' }}
      >
        <div className="relative flex flex-shrink-0 items-center justify-center px-4 pt-3 pb-1">
          <span className="h-1 w-9 rounded-full" style={{ background: '#d8d6d2' }} aria-hidden="true" />
          <button
            onClick={onClose}
            className="absolute right-3 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95"
            style={{ background: '#ffffff', color: '#706d67' }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-4 pt-1">
          <PostForm onSubmit={onSubmit} onSubmitted={onClose} />
        </div>
      </div>
    </div>
  )
}
