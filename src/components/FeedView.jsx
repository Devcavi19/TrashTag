import { useState } from 'react'
import CreatePostForm from './CreatePostForm'
import PostCard from './PostCard'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'event', label: 'Events' },
  { key: 'news', label: 'News' },
  { key: 'post', label: 'Posts' },
]

function FeedView({ posts, addPost, onLike, currentUser }) {
  const [filter, setFilter] = useState('all')

  const visible = filter === 'all' ? posts : posts.filter((p) => p.type === filter)

  return (
    <div className="p-4 space-y-4">
      <CreatePostForm onSubmit={addPost} />

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {FILTERS.map(({ key, label }) => {
          const active = filter === key
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="rounded-full px-4 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-all active:scale-95"
              style={
                active
                  ? { background: '#0d3320', color: '#ffffff' }
                  : { background: '#ffffff', color: '#a8a5a0', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
              }
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Post list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-2 text-center">
          <span className="text-3xl" style={{ opacity: 0.25 }}>🌱</span>
          <p className="text-sm font-medium" style={{ color: '#c8c5c0' }}>
            {filter === 'all' ? 'No posts yet. Be the first to share!' : 'Nothing here yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser?.id}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedView
