import { useEffect, useRef } from 'react'

// Signs the user out after `timeoutMs` of no interaction.
// Activity (pointer/keyboard/scroll/touch, or the tab regaining focus)
// resets the countdown. A cross-tab timestamp in localStorage keeps the
// idle clock honest across reloads and other tabs.
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown']
const LAST_ACTIVE_KEY = 'trashtag:lastActive'

export function useIdleLogout(enabled, onTimeout, timeoutMs = 10 * 60 * 1000) {
  // Keep the latest callback without re-arming the effect on every render.
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    if (!enabled) return

    let timer

    const fire = () => {
      localStorage.removeItem(LAST_ACTIVE_KEY)
      onTimeoutRef.current()
    }

    const arm = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVE_KEY)) || Date.now()
      const remaining = last + timeoutMs - Date.now()
      clearTimeout(timer)
      if (remaining <= 0) {
        fire()
      } else {
        timer = setTimeout(fire, remaining)
      }
    }

    const bump = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, String(Date.now()))
      arm()
    }

    // Re-check when the tab becomes visible again (background timers are throttled).
    const onVisible = () => {
      if (document.visibilityState === 'visible') arm()
    }

    bump() // seed the timestamp and start the countdown
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }))
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump))
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, timeoutMs])
}
