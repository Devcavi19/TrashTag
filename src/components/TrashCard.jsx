import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { formatDistance } from '../utils/haversine'
import ConfirmModal from './ConfirmModal'
import Card from './ui/Card'
import Button from './ui/Button'
import CollectorCredential from './CollectorCredential'
import sampleTrash from '../assets/sample_trash.jpg'

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function TrashCard({ request, currentUserId, onAccept, onLike, onOpenThread, credentialFor, distanceMeters }) {
  const { id, photo, tags = [], status, gps, price, postedAt, likes = [], postedBy, collectedBy } = request

  const [confirmAccept, setConfirmAccept] = useState(false)

  const isOwner = postedBy === currentUserId
  const isCollector = collectedBy === currentUserId
  const involved = isOwner || isCollector
  const liked = likes.includes(currentUserId)

  return (
    <Card>
      {/* Photo header with status + price overlays */}
      <div className="relative">
        <img
          src={photo || sampleTrash}
          alt="trash"
          className="w-full object-cover"
          style={{ maxHeight: 160 }}
          onError={(e) => {
            if (e.currentTarget.src !== sampleTrash) e.currentTarget.src = sampleTrash
          }}
        />
        <span
          className="absolute left-2.5 top-2.5 inline-flex rounded-full"
          style={{
            background: 'var(--surface-card)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          <StatusBadge variant={status} />
        </span>
        <span
          className="absolute bottom-2.5 right-2.5 rounded-[10px] px-2.5 py-1 text-[15px] font-bold"
          style={{
            background: 'var(--brand-ink)',
            color: 'var(--on-brand-ink)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          ₱{price}
        </span>
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* Location + distance + freshness */}
        <p className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate">{gps}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            {distanceMeters != null && <> · {formatDistance(distanceMeters)}</>} · {timeAgo(postedAt)}
          </span>
        </p>

        {/* Trash-type chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <StatusBadge variant={tags} />
        </div>

        {/* Like UI removed per Dispatch UX reqs */}

        {/* Primary action — Accept on others' open jobs; Open conversation once involved */}
        {status === 'open' && !isOwner && (
          <>
            <Button full className="mt-3.5" onClick={() => setConfirmAccept(true)}>
              Accept pickup
            </Button>
            <ConfirmModal
              open={confirmAccept}
              title="Accept this pickup?"
              message="You commit to collecting this trash. It opens a conversation with the poster where you'll track, upload proof, and get paid."
              confirmLabel="Accept pickup"
              onConfirm={() => { setConfirmAccept(false); onAccept(id) }}
              onCancel={() => setConfirmAccept(false)}
            />
          </>
        )}

        {status === 'open' && isOwner && (
          <p className="mt-3.5 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Waiting for a Green Collector to accept…
          </p>
        )}

        {/* Who's coming — the Green Collector's credential, visible to the poster */}
        {status !== 'open' && isOwner && collectedBy && credentialFor?.(collectedBy) && (
          <div className="mt-3">
            <CollectorCredential {...credentialFor(collectedBy)} />
          </div>
        )}

        {status !== 'open' && involved && onOpenThread && (
          <Button variant="secondary" full className="mt-3.5" onClick={() => onOpenThread(request)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Open conversation
          </Button>
        )}
      </div>
    </Card>
  )
}
