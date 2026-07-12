// Notification preferences — three switches gating the in-app alert toasts.
// Optimistic: flip immediately, write through onSave, revert if it fails.
import { useState } from 'react'
import Sheet from './ui/Sheet'
import Toggle from './ui/Toggle'

const ROWS = [
  { key: 'jobUpdates', label: 'Job updates', sub: 'Pickup accepted, cleanup proof, payment' },
  { key: 'messages', label: 'Messages', sub: 'New chat messages on your pickups' },
  { key: 'community', label: 'Community', sub: 'New posts and events in the feed' },
]

export default function NotificationsSheet({ open, onClose, prefs, onSave }) {
  const [local, setLocal] = useState(prefs)

  async function toggle(key) {
    const next = { ...local, [key]: !local[key] }
    setLocal(next)
    const ok = await onSave(next)
    if (!ok) setLocal(local)
  }

  return (
    <Sheet open={open} title="Notifications" onClose={onClose}>
      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
        Alerts show inside the app while you&apos;re using it.
      </p>
      <div className="mt-1">
        {ROWS.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <div className="h-px" style={{ background: 'var(--border)' }} />}
            <Toggle checked={local[row.key]} onChange={() => toggle(row.key)} label={row.label} sub={row.sub} />
          </div>
        ))}
      </div>
    </Sheet>
  )
}
