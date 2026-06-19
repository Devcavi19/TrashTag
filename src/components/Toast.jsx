// Lightweight bottom toast. Renders nothing when `message` is falsy.
export default function Toast({ message, tone = 'error' }) {
  if (!message) return null

  const bg = tone === 'error' ? '#b53419' : '#0d3320'

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-full max-w-[430px] rounded-xl px-4 py-3 text-sm font-semibold text-white flex items-center gap-2"
        style={{ background: bg, boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <path d="M12 9v4" /><path d="M12 17h.01" /><circle cx="12" cy="12" r="10" />
        </svg>
        {message}
      </div>
    </div>
  )
}
