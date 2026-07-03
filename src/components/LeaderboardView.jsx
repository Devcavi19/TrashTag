// The Leaderboard's own screen, reached from the bottom nav. It opens with the
// community's real impact (the thesis), then ranks collectors by completed jobs.
import EmptyState from './ui/EmptyState'

const AMBER = 'var(--accent)'
const FAINT = 'var(--text-muted)'
const LINE = 'var(--border)'

const tint = (token) => `color-mix(in srgb, ${token} 16%, transparent)`

const RANK_BADGES = {
  0: { emoji: '🥇', bg: tint('var(--accent)') },
  1: { emoji: '🥈', bg: tint('var(--text-secondary)') },
  2: { emoji: '🥉', bg: tint('var(--danger)') },
}

function computeRanked(requests, users) {
  const paidJobs = requests.filter((r) => r.status === 'paid' && r.collectedBy)

  const statsById = {}
  paidJobs.forEach((r) => {
    const entry = statsById[r.collectedBy] || { jobs: 0, ratingSum: 0, ratingCount: 0 }
    entry.jobs += 1
    if (typeof r.rating === 'number') {
      entry.ratingSum += r.rating
      entry.ratingCount += 1
    }
    statsById[r.collectedBy] = entry
  })

  const ranked = Object.entries(statsById)
    .map(([userId, s]) => ({
      userId,
      name: users.find((u) => u.id === userId)?.name || 'Unknown Collector',
      jobs: s.jobs,
      avgRating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0,
    }))
    .sort((a, b) => b.jobs - a.jobs || b.avgRating - a.avgRating)

  return { ranked, totalJobs: paidJobs.length }
}

function Row({ entry, rank, isMe }) {
  const badge = RANK_BADGES[rank]
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{
        background: isMe ? 'color-mix(in srgb, var(--brand) 8%, var(--surface-card))' : 'var(--surface-card)',
        border: isMe ? '1px solid var(--brand)' : `1px solid ${LINE}`,
      }}
    >
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
        style={{
          width: 32,
          height: 32,
          background: badge ? badge.bg : 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
          color: FAINT,
        }}
      >
        {badge ? badge.emoji : `#${rank + 1}`}
      </div>

      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {entry.name}
        {isMe && <span className="ml-1.5 text-[11px] font-bold" style={{ color: AMBER }}>YOU</span>}
      </span>

      <span className="text-[12px] font-semibold" style={{ color: 'var(--success)' }}>
        {entry.jobs} {entry.jobs === 1 ? 'job' : 'jobs'}
      </span>
      {entry.avgRating > 0 && (
        <span className="text-[12px] font-bold tabular-nums" style={{ color: AMBER }}>
          ★{entry.avgRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default function LeaderboardView({ requests, users, currentUser }) {
  const { ranked, totalJobs } = computeRanked(requests, users)
  const myId = currentUser?.id

  return (
    <div className="space-y-4 p-4">
      {/* Hero — the community's real impact is the thesis of this screen */}
      <div
        className="px-5 py-5"
        style={{
          background: 'var(--brand-ink)',
          color: 'var(--on-brand-ink)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ opacity: 0.5 }}>
          Bayanihan board
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="font-display leading-none" style={{ fontSize: 44, fontWeight: 600 }}>{totalJobs}</span>
          <span className="text-[14px] font-semibold" style={{ opacity: 0.8 }}>
            pickups cleaned
          </span>
        </div>
        <p className="mt-1.5 text-[12.5px]" style={{ opacity: 0.6 }}>
          {ranked.length === 0
            ? 'Be the first collector on the board.'
            : `by ${ranked.length} ${ranked.length === 1 ? 'collector' : 'collectors'} across the neighborhood.`}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: AMBER }}>
          🏆 Top collectors
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: FAINT }}>
          All time
        </span>
      </div>

      {ranked.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No completed jobs yet"
          body="Accept a pickup to climb the board."
        />
      ) : (
        <div className="space-y-2">
          {ranked.map((entry, i) => (
            <Row key={entry.userId} entry={entry} rank={i} isMe={entry.userId === myId} />
          ))}
        </div>
      )}
    </div>
  )
}
