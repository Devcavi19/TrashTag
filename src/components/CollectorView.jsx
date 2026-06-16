import TrashCard from './TrashCard'

function CollectorView({ requests, updateStatus }) {
  const activeJobs = requests.filter(r => r.status === 'accepted')
  const openJobs = requests.filter(r => r.status === 'open')

  return (
    <div className="p-4 space-y-5">
      {activeJobs.length > 0 && (
        <section>
          <h2
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: '#c97f1e' }}
          >
            Active Job
          </h2>
          <div className="space-y-3">
            {activeJobs.map(r => (
              <TrashCard
                key={r.id}
                request={r}
                viewerRole="collector"
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: '#a8a5a0' }}
        >
          Available Jobs
        </h2>
        {openJobs.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center">
            <span className="text-3xl" style={{ opacity: 0.25 }}>✅</span>
            <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
              No open jobs right now. Check back soon!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openJobs.map(r => (
              <TrashCard
                key={r.id}
                request={r}
                viewerRole="collector"
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default CollectorView
