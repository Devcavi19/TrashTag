import TrashCard from './TrashCard'

function CollectorView({ requests, updateStatus }) {
  const activeJobs = requests.filter(r => r.status === 'accepted')
  const openJobs = requests.filter(r => r.status === 'open')

  return (
    <div className="p-4 space-y-6">
      {activeJobs.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-3">Active Job</h2>
          <div className="grid gap-4">
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
        <h2 className="text-lg font-bold mb-3">Available Jobs</h2>
        {openJobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No open jobs right now.</p>
        ) : (
          <div className="grid gap-4">
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
