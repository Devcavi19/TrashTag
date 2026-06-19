import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { TAG_COLORS } from '../lib/tagColors'
import ConfirmModal from './ConfirmModal'
import sampleTrash from '../assets/sample_trash.jpg'

function MapPreview({ lat, lng }) {
  const z = 15
  const n = 1 << z
  const tx = Math.floor(((lng + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const lnTanSec = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI
  const ty = Math.floor(((1 - lnTanSec) / 2) * n)
  const px = Math.round((((lng + 180) / 360) * n - tx) * 256)
  const py = Math.round((((1 - lnTanSec) / 2) * n - ty) * 256)

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        height: 90,
        backgroundImage: `url(https://tile.openstreetmap.org/${z}/${tx}/${ty}.png)`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '256px 256px',
        backgroundPosition: `calc(50% - ${px}px) calc(50% - ${py}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -100%)',
          fontSize: 18,
          lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
          pointerEvents: 'none',
        }}
      >
        📍
      </div>
    </div>
  )
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

const CONFIRM_DIALOGS = {
  accepted: {
    title: 'Accept this job?',
    message: 'You commit to picking up this trash. It will move to your active jobs.',
    confirmLabel: 'Accept Job',
    confirmColor: '#0d3320',
  },
  collected: {
    title: 'Mark as collected?',
    message: 'Confirm you have picked up the trash. The poster will be asked to pay.',
    confirmLabel: 'Mark as Collected',
    confirmColor: '#2f6b44',
  },
  paid: {
    title: 'Confirm & pay?',
    confirmLabel: 'Confirm & Pay',
    confirmColor: '#c97f1e',
  },
}

function ActionButton({ viewerRole, status, id, price, onUpdateStatus, stagedAfterPhoto }) {
  const [pendingStatus, setPendingStatus] = useState(null)

  function confirmPending() {
    if (pendingStatus) onUpdateStatus(id, pendingStatus)
    setPendingStatus(null)
  }

  const dialog = pendingStatus ? CONFIRM_DIALOGS[pendingStatus] : null

  const modal = (
    <ConfirmModal
      open={!!pendingStatus}
      title={dialog?.title}
      message={
        pendingStatus === 'paid'
          ? `Pay ₱${price} to the collector for this pickup. This cannot be undone.`
          : dialog?.message
      }
      confirmLabel={dialog?.confirmLabel}
      confirmColor={dialog?.confirmColor}
      onConfirm={confirmPending}
      onCancel={() => setPendingStatus(null)}
    />
  )

  if (viewerRole === 'collector') {
    if (status === 'open') {
      return (
        <>
          <button
            onClick={() => setPendingStatus('accepted')}
            className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: '#0d3320' }}
          >
            Accept Job
          </button>
          {modal}
        </>
      )
    }
    if (status === 'accepted') {
      const canCollect = !!stagedAfterPhoto
      return (
        <>
          <button
            onClick={() => canCollect && setPendingStatus('collected')}
            disabled={!canCollect}
            className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
            style={{
              background: canCollect ? '#2f6b44' : '#a8a5a0',
              cursor: canCollect ? 'pointer' : 'not-allowed',
            }}
          >
            Mark as Collected
          </button>
          {modal}
        </>
      )
    }
  }

  if (viewerRole === 'poster' && status === 'collected') {
    return (
      <>
        <button
          onClick={() => setPendingStatus('paid')}
          className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: '#c97f1e' }}
        >
          Confirm &amp; Pay ₱{price}
        </button>
        {modal}
      </>
    )
  }

  return null
}

export default function TrashCard({ request, viewerRole, onUpdateStatus, onRate, onLike, onOpenChat, currentUserId, stagedAfterPhoto }) {
  const { id, photo, tags = [], status, gps, lat, lng, price, postedAt, rating, afterPhoto, likes = [], postedBy } = request
  const typeColor = TAG_COLORS[tags[0]]?.color || '#706d67'

  const showComparison = (status === 'collected' || status === 'paid') && afterPhoto

  const isOwnPost = viewerRole === 'poster' && postedBy === currentUserId
  const liked = likes.includes(currentUserId)

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Signature: category color strip */}
      <div style={{ height: 5, background: typeColor }} />

      {/* Photo(s) */}
      {showComparison ? (
        <div className="grid grid-cols-2">
          <div className="relative">
            <img
              src={photo || sampleTrash}
              alt="before"
              className="w-full object-cover"
              style={{ maxHeight: 140 }}
            />
            <span
              className="absolute bottom-1 left-1 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              Before
            </span>
          </div>
          <div className="relative">
            <img
              src={afterPhoto}
              alt="after"
              className="w-full object-cover"
              style={{ maxHeight: 140 }}
            />
            <span
              className="absolute bottom-1 left-1 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(0,0,0,0.5)' }}
            >
              After
            </span>
          </div>
        </div>
      ) : photo ? (
        <img
          src={photo}
          alt="trash"
          className="w-full object-cover"
          style={{ maxHeight: 160 }}
        />
      ) : (
        <img
          src={sampleTrash}
          alt="sample trash"
          className="w-full object-cover"
          style={{ maxHeight: 160 }}
        />
      )}

      <div className="px-4 pt-3 pb-4">
        {/* Location */}
        <p className="text-xs font-medium mb-2.5" style={{ color: '#a8a5a0' }}>
          {gps}
        </p>

        {/* Map preview */}
        {lat != null && lng != null && (
          <div className="mb-2.5">
            <MapPreview lat={lat} lng={lng} />
          </div>
        )}

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

        {/* Like button */}
        {onLike && !isOwnPost && (
          <button
            onClick={() => onLike(id, currentUserId)}
            className="flex items-center gap-1.5 mt-2.5 text-sm font-semibold transition-all active:scale-95"
            style={{ color: liked ? '#c0392b' : '#a8a5a0' }}
            aria-pressed={liked}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likes.length}</span>
          </button>
        )}

        <ActionButton
          viewerRole={viewerRole}
          status={status}
          id={id}
          price={price}
          onUpdateStatus={onUpdateStatus}
          stagedAfterPhoto={stagedAfterPhoto}
        />

        {status === 'accepted' && onOpenChat && (
          <button
            onClick={() => onOpenChat(request)}
            className="flex items-center gap-1.5 w-full mt-2 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95 justify-center"
            style={{ background: '#edf2fb', color: '#1966b5' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Chat
          </button>
        )}

        {viewerRole === 'poster' && status === 'paid' && rating === null && (
          <div className="mt-3">
            <p className="text-xs mb-1" style={{ color: '#a8a5a0' }}>Rate your collector:</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => onRate(id, star)}
                  className="text-2xl text-gray-300 hover:text-yellow-400 transition-colors"
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}

        {viewerRole === 'poster' && status === 'paid' && rating !== null && (
          <p className="text-sm mt-3" style={{ color: '#c97f1e' }}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)} Rated
          </p>
        )}
      </div>
    </div>
  )
}
