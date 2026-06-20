// The Leaderboard's own screen, reached from the bottom nav. It opens with the
// community's real impact (the thesis), then ranks collectors by completed jobs.

const FOREST = '#0d3320'
const AMBER = '#c97f1e'
const FAINT = '#a8a5a0'
const LINE = '#e9e9e6'

const RANK_BADGES = {
  0: { emoji: '🥇', bg: '#fbf0d4', color: '#c97f1e' },
  1: { emoji: '🥈', bg: '#eef0f1', color: '#7c8a92' },
  2: { emoji: '🥉', bg: '#f3e6da', color: '#a4632a' },
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
        background: isMe ? '#f4faf6' : '#ffffff',
        border: isMe ? `1px solid ${FOREST}` : `1px solid ${LINE}`,
      }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 rounded-full text-[13px] font-bold"
        style={{
          width: 32,
          height: 32,
          background: badge ? badge.bg : '#f3f4f2',
          color: badge ? badge.color : FAINT,
        }}
      >
        {badge ? badge.emoji : `#${rank + 1}`}
      </div>

      <span className="flex-1 min-w-0 truncate text-[14px] font-semibold" style={{ color: FOREST }}>
        {entry.name}
        {isMe && <span className="ml-1.5 text-[11px] font-bold" style={{ color: AMBER }}>YOU</span>}
      </span>

      <span className="text-[12px] font-semibold" style={{ color: '#2f6b44' }}>
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
    <div className="p-4 space-y-4">
      {/* Hero — the community's real impact is the thesis of this screen */}
      <div className="rounded-2xl px-5 py-5 text-white" style={{ background: FOREST }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Bayanihan board
        </p>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="font-display leading-none" style={{ fontSize: 44, fontWeight: 600 }}>{totalJobs}</span>
          <span className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
            pickups cleaned
          </span>
        </div>
        <p className="text-[12.5px] mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
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
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-3xl" style={{ opacity: 0.25 }}>🏆</span>
          <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
            No completed jobs yet. Accept a pickup to climb the board!
          </p>
        </div>
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
