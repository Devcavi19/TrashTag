import { useEffect, useState } from 'react'

export default function LoadingScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800)
    const doneTimer = setTimeout(() => onDone(), 2300)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'var(--brand-ink)',
        color: 'var(--on-brand-ink)',
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        zIndex: 9999,
      }}
    >
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: 'color-mix(in srgb, var(--on-brand-ink) 14%, transparent)' }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            <path d="M10 11v5M14 11v5" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="font-display text-3xl tracking-tight" style={{ fontWeight: 600 }}>
            TrashTag
            <span className="ml-1 text-lg font-medium" style={{ opacity: 0.6 }}>PH</span>
          </h1>
          <p className="mt-1 text-sm" style={{ opacity: 0.55 }}>
            Trash that pays. Community that cleans.
          </p>
        </div>
      </div>

      {/* Spinner */}
      <div className="mt-12">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{
            borderColor: 'color-mix(in srgb, var(--on-brand-ink) 25%, transparent)',
            borderTopColor: 'var(--on-brand-ink)',
          }}
        />
      </div>
    </div>
  )
}
