import { useState, useEffect, useRef, useCallback } from 'react'

const STORAGE_KEY = 'trashtag:requests'
const CHANNEL_NAME = 'trashtag'

function loadInitial(fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* corrupted or unavailable storage — fall back */
  }
  return fallback
}

/**
 * Shared `requests` state that stays in sync across tabs/windows in real time.
 *
 * - BroadcastChannel pushes every local change to other open tabs instantly.
 * - localStorage persists the latest state so a freshly opened tab starts in sync.
 *
 * Note: browsers isolate BroadcastChannel + localStorage between normal and
 * private/InPrivate windows, so sync only works between windows of the same type.
 */
export function useSharedRequests(fallback) {
  const [requests, setRequestsState] = useState(() => loadInitial(fallback))
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    // Apply updates coming from other tabs (do NOT re-broadcast — avoids loops).
    channel.onmessage = (event) => {
      if (event.data?.type === 'requests') {
        setRequestsState(event.data.payload)
      }
    }

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  // Drop-in replacement for the useState setter: updates local state, then
  // persists and broadcasts the result so other tabs stay in sync.
  const setRequests = useCallback((updater) => {
    setRequestsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage may be full or unavailable — sync still works in-session */
      }
      channelRef.current?.postMessage({ type: 'requests', payload: next })
      return next
    })
  }, [])

  return [requests, setRequests]
}
