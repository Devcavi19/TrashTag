import { useState } from 'react'
import PostForm from './PostForm'
import TrashCard from './TrashCard'
import Leaderboard from './Leaderboard'
import SuccessModal from './SuccessModal'
import CollectorTracker from './CollectorTracker'

function PosterView({ requests, addRequest, updateStatus, onRate, onLike, currentUser, users }) {
  const [success, setSuccess] = useState(null)

  function handleUpdate(reqId, newStatus) {
    updateStatus(reqId, newStatus)
    if (newStatus === 'paid') {
      setSuccess({
        title: 'Payment confirmed!',
        message: 'Thanks for keeping the community clean. Don’t forget to rate your collector.',
      })
    }
  }

  return (
    <div className="p-4 space-y-5">
      <PostForm onSubmit={addRequest} />

      <section>
        <h2
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: '#a8a5a0' }}
        >
          My Requests
        </h2>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center">
            <span className="text-3xl" style={{ opacity: 0.25 }}>🗑️</span>
            <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
              No posts yet. Add your first trash pickup!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id}>
                <TrashCard
                  request={req}
                  viewerRole="poster"
                  onUpdateStatus={handleUpdate}
                  onRate={onRate}
                  onLike={onLike}
                  currentUserId={currentUser?.id}
                />
                {req.status === 'accepted' && (
                  <CollectorTracker request={req} />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Leaderboard requests={requests} users={users} />

      <SuccessModal
        open={!!success}
        title={success?.title}
        message={success?.message}
        buttonLabel="Done"
        onClose={() => setSuccess(null)}
      />
    </div>
  )
}

export default PosterView
