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
        background: '#0d3320',
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        zIndex: 9999,
      }}
    >
      {/* Logo mark */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: '#c97f1e' }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11v5M14 11v5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-white font-bold text-3xl tracking-tight">
            TrashTag
            <span style={{ color: '#c97f1e' }} className="text-lg ml-1 font-medium">PH</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Trash that pays. Community that cleans.
          </p>
        </div>
      </div>

      {/* Spinner */}
      <div className="mt-12">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.25)', borderTopColor: '#c97f1e' }}
        />
      </div>
    </div>
  )
}
