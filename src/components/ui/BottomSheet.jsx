import { useRef, useState } from 'react'

const ORDER = ['peek', 'half', 'full']

// Persistent draggable bottom sheet with three detents. Purely controlled —
// parent owns `detent`. Dragging the handle overrides the height live and
// snaps to the nearest detent on release; a tap on the handle cycles detents.
// Content scrolls internally; only the handle owns the drag gesture, so
// scrolling and dragging never fight.
export default function BottomSheet({
  detent = 'peek',
  onDetentChange,
  peekHeight = 136,
  bottomOffset = 0,
  children,
}) {
  const [dragHeight, setDragHeight] = useState(null)
  const drag = useRef(null)

  const heights = {
    peek: peekHeight,
    half: Math.round(window.innerHeight * 0.5),
    full: Math.round(window.innerHeight * 0.88),
  }

  function snapTo(px) {
    let best = ORDER[0]
    for (const d of ORDER) {
      if (Math.abs(heights[d] - px) < Math.abs(heights[best] - px)) best = d
    }
    return best
  }

  function onPointerDown(e) {
    drag.current = { startY: e.clientY, startH: dragHeight ?? heights[detent], moved: false }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!drag.current) return
    const dy = drag.current.startY - e.clientY
    if (Math.abs(dy) > 4) drag.current.moved = true
    setDragHeight(Math.max(heights.peek, Math.min(heights.full, drag.current.startH + dy)))
  }

  function onPointerUp() {
    if (!drag.current) return
    if (drag.current.moved && dragHeight != null) {
      onDetentChange?.(snapTo(dragHeight))
    } else {
      onDetentChange?.(ORDER[(ORDER.indexOf(detent) + 1) % ORDER.length])
    }
    drag.current = null
    setDragHeight(null)
  }

  return (
    <div
      className={`absolute inset-x-0 z-30 flex flex-col ${dragHeight == null ? 'tt-sheet-detent' : ''}`}
      style={{
        bottom: bottomOffset,
        height: dragHeight ?? heights[detent],
        background: 'var(--surface)',
        borderRadius: '22px 22px 0 0',
        boxShadow: 'var(--shadow-raised)',
      }}
    >
      <button
        type="button"
        aria-label={`Sheet at ${detent} height — tap to change`}
        className="flex w-full flex-none cursor-grab justify-center py-3"
        style={{ touchAction: 'none', background: 'transparent' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span aria-hidden className="h-1 w-10 rounded-full" style={{ background: 'var(--border)' }} />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  )
}
