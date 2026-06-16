import PostForm from './PostForm'
import TrashCard from './TrashCard'

function PosterView({ requests, addRequest, updateStatus }) {
  return (
    <div className="p-4 space-y-6">
      <PostForm onSubmit={addRequest} />

      <section>
        <h2 className="text-lg font-bold mb-3">My Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            No requests yet. Post your first one above.
          </p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <TrashCard
                key={req.id}
                request={req}
                viewerRole="poster"
                onUpdateStatus={updateStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default PosterView
