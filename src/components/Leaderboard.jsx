const RANK_BADGES = {
  0: { emoji: '🥇', bg: '#fbf0d4', color: '#c97f1e' }, // gold
  1: { emoji: '🥈', bg: '#eef0f1', color: '#7c8a92' }, // silver
  2: { emoji: '🥉', bg: '#f3e6da', color: '#a4632a' }, // bronze
}

function Leaderboard({ requests, users }) {
  // Compute ranked list at runtime
  const paidJobs = requests.filter(r => r.status === 'paid' && r.collectedBy)

  const statsById = {}
  paidJobs.forEach(r => {
    const entry = statsById[r.collectedBy] || { jobs: 0, ratingSum: 0, ratingCount: 0 }
    entry.jobs += 1
    if (typeof r.rating === 'number') {
      entry.ratingSum += r.rating
      entry.ratingCount += 1
    }
    statsById[r.collectedBy] = entry
  })

  const ranked = Object.entries(statsById)
    .map(([userId, s]) => {
      const user = users.find(u => u.id === userId)
      return {
        userId,
        name: user?.name || 'Unknown Collector',
        jobs: s.jobs,
        avgRating: s.ratingCount > 0 ? s.ratingSum / s.ratingCount : 0,
      }
    })
    .sort((a, b) => b.jobs - a.jobs || b.avgRating - a.avgRating)

  return (
    <section>
      <h2
        className="text-[10px] font-bold uppercase tracking-widest mb-3"
        style={{ color: '#c97f1e' }}
      >
        🏆 Leaderboard
      </h2>

      {ranked.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2 text-center">
          <span className="text-3xl" style={{ opacity: 0.25 }}>🏆</span>
          <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
            No completed jobs yet. Be the first on the board!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranked.map((entry, i) => {
            const badge = RANK_BADGES[i]
            return (
              <div
                key={entry.userId}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: '#ffffff', border: '1px solid #e9e9e6' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0 rounded-full text-sm font-bold"
                  style={{
                    width: 30,
                    height: 30,
                    background: badge ? badge.bg : '#f3f4f2',
                    color: badge ? badge.color : '#a8a5a0',
                  }}
                >
                  {badge ? badge.emoji : `#${i + 1}`}
                </div>

                <span
                  className="flex-1 text-sm font-semibold truncate"
                  style={{ color: '#0d3320' }}
                >
                  {entry.name}
                </span>

                <span className="text-xs font-medium" style={{ color: '#2f6b44' }}>
                  {entry.jobs} {entry.jobs === 1 ? 'job' : 'jobs'}
                </span>

                {entry.avgRating > 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#c97f1e' }}>
                    ★{entry.avgRating.toFixed(1)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Leaderboard
