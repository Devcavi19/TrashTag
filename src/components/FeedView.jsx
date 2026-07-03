import { useState } from 'react'
import CreatePostForm from './CreatePostForm'
import PostCard from './PostCard'
import EmptyState from './ui/EmptyState'

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
              className="tt-press whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold"
              style={
                active
                  ? { background: 'var(--brand-ink)', color: 'var(--on-brand-ink)' }
                  : {
                      background: 'var(--surface-card)',
                      color: 'var(--text-muted)',
                      boxShadow: '0 0 0 1px var(--border)',
                    }
              }
              aria-pressed={active}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Post list */}
      {visible.length === 0 ? (
        <EmptyState
          icon="🌱"
          title={filter === 'all' ? 'No posts yet' : 'Nothing here yet'}
          body={filter === 'all' ? 'Be the first to share news, an event, or a note.' : 'Try another filter or share something yourself.'}
        />
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
