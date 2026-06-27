import { useState } from 'react'
import StatusBadge from './StatusBadge'

function initialsOf(name) {
  return name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?'
}

const ACTIVE = ['accepted', 'collected', 'disputed']

function roleLine(r, myId) {
  return r.postedBy === myId ? 'You posted' : 'You collect'
}

// Avatar that stacks behind itself when a person shares more than one pickup —
// the visual cue that this is one relationship with history, not a duplicate.
function Avatar({ name, stacked }) {
  return (
    <span className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
      {stacked && (
        <>
          <span className="absolute rounded-full" style={{ inset: 0, background: '#cfe0d6', transform: 'translate(5px, 5px)' }} />
          <span className="absolute rounded-full" style={{ inset: 0, background: '#9fc1ad', transform: 'translate(2.5px, 2.5px)' }} />
        </>
      )}
      <span
        className="absolute inset-0 flex items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: '#0d3320' }}
      >
        {initialsOf(name)}
      </span>
    </span>
  )
}

function Row({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left transition-all active:scale-[0.99]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {children}
    </button>
  )
}

function Header({ title, onBack }) {
  return (
    <div
      className="flex flex-shrink-0 items-center gap-3 bg-white px-4 py-3"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
    >
      <button
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95"
        style={{ background: '#f3f4f2', color: '#706d67' }}
        aria-label="Back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <span className="font-display text-[20px]" style={{ color: '#0d3320', fontWeight: 600 }}>
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
      <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col" style={{ background: '#f3f4f2' }}>
        <Header title={nameOf(person.id)} onBack={() => setOpenPersonId(null)} />
        <div className="flex-1 overflow-y-auto p-3">
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#a8a5a0' }}>
            {person.jobs.length} pickups together
          </p>
          <div className="space-y-2">
            {person.jobs.map((r) => (
              <Row key={r.id} onClick={() => onOpenThread(r)}>
                <span
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base"
                  style={{ background: '#f3f4f2' }}
                >
                  {r.postedBy === myId ? '📤' : '🧹'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: '#1c1c1e' }}>
                    {r.gps}
                  </p>
                  <p className="truncate text-xs" style={{ color: '#a8a5a0' }}>
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
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col" style={{ background: '#f3f4f2' }}>
      <Header title="Messages" onBack={onClose} />

      <div className="flex-1 overflow-y-auto p-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-20 text-center">
            <span className="text-3xl" style={{ opacity: 0.25 }}>💬</span>
            <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
              No conversations yet. Accept a pickup or wait for someone to accept yours.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => {
              const latest = g.jobs[0]
              const multi = g.jobs.length > 1
              const activeCount = g.jobs.filter((r) => ACTIVE.includes(r.status)).length
              const open = () => (multi ? setOpenPersonId(g.id) : onOpenThread(latest))

              return (
                <Row key={g.id} onClick={open}>
                  <Avatar name={nameOf(g.id)} stacked={multi} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: '#1c1c1e' }}>
                      {nameOf(g.id)}
                    </p>
                    <p className="truncate text-xs" style={{ color: '#a8a5a0' }}>
                      {multi
                        ? `${g.jobs.length} pickups${activeCount ? ` · ${activeCount} in progress` : ''}`
                        : `${roleLine(latest, myId)} · ${latest.gps} · ₱${latest.price}`}
                    </p>
                  </div>
                  {multi ? (
                    <span className="flex items-center gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                        style={{ background: activeCount ? '#fef3e0' : '#e6f0eb', color: activeCount ? '#c97f1e' : '#0d3320' }}
                      >
                        {g.jobs.length}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c8c5c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
