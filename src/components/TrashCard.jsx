import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { TAG_COLORS } from '../lib/tagColors'
import { formatDistance } from '../utils/haversine'
import ConfirmModal from './ConfirmModal'
import sampleTrash from '../assets/sample_trash.jpg'

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function TrashCard({ request, currentUserId, onAccept, onLike, onOpenThread, distanceMeters }) {
  const { id, photo, tags = [], status, gps, price, postedAt, likes = [], postedBy, collectedBy } = request
  const typeColor = TAG_COLORS[tags[0]]?.color || '#706d67'

  const [confirmAccept, setConfirmAccept] = useState(false)

  const isOwner = postedBy === currentUserId
  const isCollector = collectedBy === currentUserId
  const involved = isOwner || isCollector
  const liked = likes.includes(currentUserId)

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Signature: category color strip */}
      <div style={{ height: 5, background: typeColor }} />

      <div className="relative">
        <img
          src={photo || sampleTrash}
          alt="trash"
          className="w-full object-cover"
          style={{ maxHeight: 160 }}
        />
        {distanceMeters != null && (
          <span
            className="absolute top-2 left-2 flex items-center gap-1 rounded-full pl-1.5 pr-2 py-1 text-[11px] font-bold"
            style={{
              background: 'rgba(255,255,255,0.92)',
              color: '#0d3320',
              backdropFilter: 'blur(4px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {formatDistance(distanceMeters)}
          </span>
        )}
      </div>

      <div className="px-4 pt-3 pb-4">
        {/* Location */}
        <p className="text-xs font-medium mb-3" style={{ color: '#a8a5a0' }}>
          {gps}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge variant={tags} />
          <StatusBadge variant={status} />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[22px] font-bold leading-none" style={{ color: '#c97f1e' }}>
            ₱{price}
          </span>
          <span className="text-[11px] font-medium" style={{ color: '#c8c5c0' }}>
            payout
          </span>
        </div>

        {/* Timestamp */}
        <p className="text-xs mt-1" style={{ color: '#c8c5c0' }}>
          Posted {timeAgo(postedAt)}
        </p>

        {/* Like — can't like your own post */}
        {onLike && !isOwner && (
          <button
            onClick={() => onLike(id, currentUserId)}
            className="flex items-center gap-1.5 mt-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ color: liked ? '#c0392b' : '#a8a5a0' }}
            aria-pressed={liked}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likes.length}</span>
          </button>
        )}

        {/* Primary action — Accept on others' open jobs; Open conversation once involved */}
        {status === 'open' && !isOwner && (
          <>
            <button
              onClick={() => setConfirmAccept(true)}
              className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: '#0d3320' }}
            >
              Accept pickup
            </button>
            <ConfirmModal
              open={confirmAccept}
              title="Accept this pickup?"
              message="You commit to collecting this trash. It opens a conversation with the poster where you'll track, upload proof, and get paid."
              confirmLabel="Accept pickup"
              confirmColor="#0d3320"
              onConfirm={() => { setConfirmAccept(false); onAccept(id) }}
              onCancel={() => setConfirmAccept(false)}
            />
          </>
        )}

        {status === 'open' && isOwner && (
          <p className="mt-4 text-center text-xs font-medium" style={{ color: '#a8a5a0' }}>
            Waiting for a neighbor to accept…
          </p>
        )}

        {status !== 'open' && involved && onOpenThread && (
          <button
            onClick={() => onOpenThread(request)}
            className="flex items-center justify-center gap-1.5 w-full mt-4 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: '#edf2fb', color: '#1966b5' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Open conversation
          </button>
        )}
      </div>
    </div>
  )
}
