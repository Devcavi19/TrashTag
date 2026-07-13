import { formatDistance } from '../utils/haversine'
import StatusBadge from './StatusBadge'
import sampleTrash from '../assets/sample_trash.jpg'

// Slim dispatch job row: thumbnail, place, distance, status/tag chip, and the
// price set in the display serif. Selecting a row reveals its `action` node.
export default function JobRow({ request, distanceMeters, selected, action, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.() }}
      className="tt-press flex w-full flex-col rounded-[14px] border p-2.5 text-left"
      style={{
        background: 'var(--surface-card)',
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-3">
        <img
          src={request.photo || sampleTrash}
          alt=""
          className="h-12 w-12 flex-none rounded-[10px] object-cover"
          onError={(e) => { if (e.currentTarget.src !== sampleTrash) e.currentTarget.src = sampleTrash }}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {request.gps || 'Pickup nearby'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {distanceMeters != null && <span>{formatDistance(distanceMeters)}</span>}
            <StatusBadge variant={request.status === 'open' ? request.tags?.[0] : request.status} />
          </div>
        </div>
        <span className="font-display text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
          ₱{request.price}
        </span>
      </div>
      {selected && action && <div className="mt-2.5">{action}</div>}
    </div>
  )
}
