import StatusBadge from './StatusBadge'

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

const TYPE_COLORS = {
  Biodegradable: '#22863a',
  Recyclable: '#1966b5',
  Residual: '#b53419',
}

function ActionButton({ viewerRole, status, id, price, onUpdateStatus }) {
  if (viewerRole === 'collector') {
    if (status === 'open') {
      return (
        <button
          onClick={() => onUpdateStatus(id, 'accepted')}
          className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: '#0d3320' }}
        >
          Accept Job
        </button>
      )
    }
    if (status === 'accepted') {
      return (
        <button
          onClick={() => onUpdateStatus(id, 'collected')}
          className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: '#2f6b44' }}
        >
          Mark as Collected
        </button>
      )
    }
  }

  if (viewerRole === 'poster' && status === 'collected') {
    return (
      <button
        onClick={() => onUpdateStatus(id, 'paid')}
        className="w-full mt-4 text-white text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-95"
        style={{ background: '#c97f1e' }}
      >
        Confirm &amp; Pay ₱{price}
      </button>
    )
  }

  return null
}

export default function TrashCard({ request, viewerRole, onUpdateStatus }) {
  const { id, photo, type, status, gps, price, postedAt } = request
  const typeColor = TYPE_COLORS[type] || '#706d67'

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Signature: category color strip */}
      <div style={{ height: 5, background: typeColor }} />

      {/* Photo */}
      {photo ? (
        <img
          src={photo}
          alt="trash"
          className="w-full object-cover"
          style={{ maxHeight: 160 }}
        />
      ) : (
        <div
          className="w-full flex flex-col items-center justify-center gap-1"
          style={{ height: 88, background: '#f8f7f5' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d0cdc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span className="text-[11px] font-medium" style={{ color: '#c8c5c0' }}>
            No photo
          </span>
        </div>
      )}

      <div className="px-4 pt-3 pb-4">
        {/* Location */}
        <p className="text-xs font-medium mb-2.5" style={{ color: '#a8a5a0' }}>
          {gps}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <StatusBadge variant={type} />
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

        <ActionButton
          viewerRole={viewerRole}
          status={status}
          id={id}
          price={price}
          onUpdateStatus={onUpdateStatus}
        />
      </div>
    </div>
  )
}
