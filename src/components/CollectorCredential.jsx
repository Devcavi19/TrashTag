// The poster-side trust line: "Mang Ramon · ✓ Verified Green Collector ·
// ★4.9 · 214 pickups". Passively visible wherever the collector appears;
// tapping it opens the full Green Collector ID sheet. Adds zero required
// taps to the poster flow.
import { useState } from 'react'
import Avatar from './ui/Avatar'
import CredentialSheet, { VerifiedBadge } from './CredentialSheet'

export default function CollectorCredential({ profile, credential, className = '' }) {
  const [open, setOpen] = useState(false)
  if (!profile || !credential) return null

  const rating = credential.rating != null ? `★${credential.rating.toFixed(1)}` : null
  const pickups = `${credential.pickups} pickup${credential.pickups === 1 ? '' : 's'}`

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`tt-press flex w-full min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left ${className}`}
        style={{ background: 'color-mix(in srgb, var(--brand) 7%, transparent)' }}
        aria-label={`View ${profile.name || 'collector'}'s Green Collector ID`}
      >
        <Avatar name={profile.name || 'Collector'} src={profile.avatar_url} size={28} className="flex-shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 truncate text-[12.5px] font-bold" style={{ color: 'var(--text-primary)' }}>
            <span className="truncate">{profile.name || 'Collector'}</span>
            {credential.verified && <VerifiedBadge size={12} />}
          </span>
          <span className="block truncate text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            {credential.verified ? `${credential.tierLabel} Green Collector` : 'Green Collector'}
            {rating && <> · {rating}</>}
            {' · '}
            {pickups}
          </span>
        </span>
        <svg className="flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
      <CredentialSheet open={open} onClose={() => setOpen(false)} profile={profile} credential={credential} />
    </>
  )
}
