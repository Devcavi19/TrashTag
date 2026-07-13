import { useEffect, useRef, useState } from 'react'

// SVG countdown ring in currentColor. Drains over `seconds`, pausing while the
// tab is hidden (backgrounded collectors shouldn't silently lose offers), then
// fires onExpire exactly once. Parent owns what expiry means.
export default function CountdownRing({ seconds = 25, size = 26, stroke = 3, onExpire }) {
  const [remaining, setRemaining] = useState(seconds)
  const expired = useRef(false)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    let last = performance.now()
    let raf
    const tick = (now) => {
      if (!document.hidden) {
        const dt = (now - last) / 1000
        setRemaining((prev) => Math.max(0, prev - dt))
      }
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (remaining <= 0 && !expired.current) {
      expired.current = true
      onExpireRef.current?.()
    }
  }, [remaining])

  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="color-mix(in srgb, currentColor 25%, transparent)" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - remaining / seconds)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
