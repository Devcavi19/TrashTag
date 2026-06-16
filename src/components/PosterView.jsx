import PostForm from './PostForm'

function PosterView({ requests, addRequest, updateStatus }) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Poster View</h2>
      <PostForm onSubmit={addRequest} />
      <p className="text-gray-500 text-sm">{requests.length} request(s) posted</p>
    </div>
  )
}

export default PosterView
