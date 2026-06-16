import PostForm from './PostForm'
import TrashCard from './TrashCard'

function PosterView({ requests, addRequest, updateStatus, onRate, onLike, currentUser }) {
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
              <TrashCard
                key={req.id}
                request={req}
                viewerRole="poster"
                onUpdateStatus={updateStatus}
                onRate={onRate}
                onLike={onLike}
                currentUserId={currentUser?.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default PosterView
