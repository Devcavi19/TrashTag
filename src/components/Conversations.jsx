import { useState } from 'react'
import StatusBadge from './StatusBadge'
import UiAvatar from './ui/Avatar'
import EmptyState from './ui/EmptyState'

const ACTIVE = ['accepted', 'collected', 'disputed', 'payment_sent']

function roleLine(r, myId) {
  return r.postedBy === myId ? 'You posted' : 'You collect'
}

// Avatar that stacks behind itself when a person shares more than one pickup —
// the visual cue that this is one relationship with history, not a duplicate.
function StackedAvatar({ name, stacked }) {
  return (
    <span className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
      {stacked && (
        <>
          <span
            className="absolute rounded-full"
            style={{ inset: 0, background: 'color-mix(in srgb, var(--brand) 25%, var(--surface))', transform: 'translate(5px, 5px)' }}
          />
          <span
            className="absolute rounded-full"
            style={{ inset: 0, background: 'color-mix(in srgb, var(--brand) 50%, var(--surface))', transform: 'translate(2.5px, 2.5px)' }}
          />
        </>
      )}
      <UiAvatar name={name} size={40} className="absolute inset-0" />
    </span>
  )
}

function Row({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="tt-press flex w-full items-center gap-3 px-3 py-3 text-left"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {children}
    </button>
  )
}

function Header({ title, onBack }) {
  return (
    <div
      className="flex flex-shrink-0 items-center gap-3 px-4 py-3"
      style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}
    >
      <button
        onClick={onBack}
        className="tt-press flex h-8 w-8 items-center justify-center rounded-full"
        style={{
          background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
          color: 'var(--text-secondary)',
        }}
        aria-label="Back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <span className="font-display text-[20px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
        {title}
      </span>
    </div>
  )
}

export default function Conversations({ requests, currentUser, users, onClose, onOpenThread }) {
  const myId = currentUser?.id
  const [openPersonId, setOpenPersonId] = useState(null)

  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unknown'

  // Every pickup I share with someone, newest first.
  const threads = requests
    .filter((r) => (r.postedBy === myId || r.collectedBy === myId) && r.status !== 'open')
    .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))

  // Collapse those into one conversation per counterpart — all jobs with the
  // same person live together instead of spawning a fresh thread each time.
  const groups = []
  const indexById = new Map()
  for (const r of threads) {
    const otherId = r.postedBy === myId ? r.collectedBy : r.postedBy
    if (!otherId) continue
    if (!indexById.has(otherId)) {
      indexById.set(otherId, groups.length)
      groups.push({ id: otherId, jobs: [] })
    }
    groups[indexById.get(otherId)].jobs.push(r)
  }
  // threads is already newest-first, so each group's first job is its latest.

  // --- Drill-down: every pickup shared with one person ---
  const person = openPersonId != null ? groups.find((g) => g.id === openPersonId) : null
  if (person) {
    return (
      <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col" style={{ background: 'var(--surface)' }}>
        <Header title={nameOf(person.id)} onBack={() => setOpenPersonId(null)} />
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {person.jobs.length} pickups together
          </p>
          <div className="space-y-2">
            {person.jobs.map((r) => (
              <Row key={r.id} onClick={() => onOpenThread(r)}>
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base"
                  style={{ background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)' }}
                >
                  {r.postedBy === myId ? '📤' : '🧹'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {r.gps}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                    {roleLine(r, myId)} · ₱{r.price}
                  </p>
                </div>
                <StatusBadge variant={r.status} />
              </Row>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- Inbox: one row per person ---
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col" style={{ background: 'var(--surface)' }}>
      <Header title="Messages" onBack={onClose} />

      <div className="flex-1 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations yet"
            body="Accept a pickup, or wait for someone to accept yours — the chat opens here."
          />
        ) : (
          <div className="space-y-2">
            {groups.map((g) => {
              const latest = g.jobs[0]
              const multi = g.jobs.length > 1
              const activeCount = g.jobs.filter((r) => ACTIVE.includes(r.status)).length
              const open = () => (multi ? setOpenPersonId(g.id) : onOpenThread(latest))

              return (
                <Row key={g.id} onClick={open}>
                  <StackedAvatar name={nameOf(g.id)} stacked={multi} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {nameOf(g.id)}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                      {multi
                        ? `${g.jobs.length} pickups${activeCount ? ` · ${activeCount} in progress` : ''}`
                        : `${roleLine(latest, myId)} · ${latest.gps} · ₱${latest.price}`}
                    </p>
                  </div>
                  {multi ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{
                          background: activeCount
                            ? 'color-mix(in srgb, var(--warning) 14%, transparent)'
                            : 'color-mix(in srgb, var(--brand) 14%, transparent)',
                          color: activeCount ? 'var(--warning)' : 'var(--brand)',
                        }}
                      >
                        {g.jobs.length}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </span>
                  ) : (
                    <StatusBadge variant={latest.status} />
                  )}
                </Row>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
