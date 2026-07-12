// The Green Collector ID card — the professional identity made inspectable.
// One Sheet, two views: the credential card and the "how do I get certified?"
// roadmap. Everything shown is derived from live data (see lib/collectorCred).
import { useState } from 'react'
import Sheet from './ui/Sheet'
import Avatar from './ui/Avatar'
import { TIER_LADDER } from '../lib/collectorCred'

const INK = 'var(--text-primary)'
const MUTED = 'var(--text-secondary)'
const FAINT = 'var(--text-muted)'

export function VerifiedBadge({ size = 14 }) {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: 'var(--brand)', color: 'var(--on-brand)' }}
      aria-label="Verified Green Collector"
      title="Verified Green Collector"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  )
}

function memberSince(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString([], { month: 'short', year: 'numeric' })
}

function IdStat({ value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 py-3">
      <span className="font-display text-[20px] leading-none" style={{ color: 'var(--brand)', fontWeight: 600 }}>
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  )
}

// The five-rung career ladder. Achieved rungs are lit; locked rungs are the
// roadmap — visible ambition, no progression logic yet.
function Ladder({ credential }) {
  const achieved = new Set()
  if (credential.verified) achieved.add('verified')
  if (credential.tier === 'top-rated') achieved.add('top-rated')

  return (
    <ol className="mt-2 space-y-0">
      {TIER_LADDER.map((rung, i) => {
        const lit = achieved.has(rung.id)
        const current = rung.id === credential.tier
        return (
          <li key={rung.id} className="flex gap-3">
            {/* rail */}
            <div className="flex flex-col items-center">
              <span
                className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={
                  lit
                    ? { background: 'var(--brand)', color: 'var(--on-brand)' }
                    : { background: 'transparent', border: '1.5px solid var(--border)', color: FAINT }
                }
              >
                {lit ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              {i < TIER_LADDER.length - 1 && (
                <span className="w-px flex-1" style={{ background: lit ? 'var(--brand)' : 'var(--border)', minHeight: 14 }} />
              )}
            </div>
            {/* rung */}
            <div className="pb-3.5">
              <p className="flex items-center gap-2 text-[13px] font-bold leading-5" style={{ color: lit ? INK : MUTED }}>
                {rung.label}
                {current && (
                  <span className="rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-widest" style={{ background: 'var(--brand)', color: 'var(--on-brand)' }}>
                    You
                  </span>
                )}
                {rung.locked && (
                  <span className="rounded-full px-1.5 py-px text-[8px] font-bold uppercase tracking-widest" style={{ background: 'color-mix(in srgb, var(--text-primary) 8%, transparent)', color: FAINT }}>
                    Coming
                  </span>
                )}
              </p>
              <p className="text-[11px]" style={{ color: FAINT }}>
                {rung.detail}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const GUIDE_STEPS = [
  {
    title: 'Join and get verified',
    body: 'Sign up, complete your profile, and get your identity confirmed by Kolek. Verification is granted — never self-service — so the badge means something at the gate.',
  },
  {
    title: 'Do the work, keep your rating',
    body: 'Every pickup you complete and every star a homeowner gives you builds your public track record. Your credential is your history — it can never be faked.',
  },
  {
    title: 'Train in safety & segregation',
    body: 'Basic safety and waste-segregation training in Kolek colors — so homeowners see a professional, and you work like one.',
  },
  {
    title: 'Earn your TESDA certificate',
    body: 'TESDA certification in solid waste management turns your experience into a recognized national credential. Certification onboarding opens soon.',
  },
  {
    title: 'Lead your barangay corps',
    body: 'Grow into Team Lead, then Barangay Coordinator — where Green Collectors organize as a recognized barangay corps that LGUs can endorse and contract.',
  },
]

function CertificationGuide({ onBack }) {
  return (
    <div>
      <button onClick={onBack} className="tt-press flex items-center gap-1 text-[12px] font-bold" style={{ color: 'var(--brand)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to ID
      </button>
      <h3 className="mt-3 font-display text-[18px] leading-snug" style={{ color: INK, fontWeight: 600 }}>
        Becoming a Certified Green Collector
      </h3>
      <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: MUTED }}>
        Collecting isn't a favor here — it's a profession with a ladder. Here's the path from your first pickup to leading a barangay corps.
      </p>
      <ol className="mt-4 space-y-3.5">
        {GUIDE_STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)', color: 'var(--brand)' }}
            >
              {i + 1}
            </span>
            <div>
              <p className="text-[13px] font-bold leading-6" style={{ color: INK }}>
                {step.title}
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: MUTED }}>
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl px-3.5 py-3 text-[11px] leading-relaxed" style={{ background: 'color-mix(in srgb, var(--brand) 8%, transparent)', color: MUTED }}>
        Training and TESDA certification onboarding open as Kolek grows in your barangay. Keep collecting — your record counts from day one.
      </p>
    </div>
  )
}

export default function CredentialSheet({ open, onClose, profile, credential }) {
  const [view, setView] = useState('card')

  function close() {
    setView('card')
    onClose?.()
  }

  if (!profile || !credential) return null
  const rating = credential.rating != null ? credential.rating.toFixed(1) : '—'

  return (
    <Sheet open={open} onClose={close} title={view === 'card' ? 'Green Collector ID' : 'Certification'}>
      {view === 'guide' ? (
        <CertificationGuide onBack={() => setView('card')} />
      ) : (
        <div>
          {/* Identity */}
          <div className="flex items-center gap-3.5">
            <Avatar name={profile.name || 'Collector'} src={profile.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-[17px] font-bold" style={{ color: INK }}>
                <span className="truncate">{profile.name || 'Collector'}</span>
                {credential.verified && <VerifiedBadge size={16} />}
              </p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: credential.verified ? 'var(--brand)' : FAINT }}>
                {credential.verified ? `${credential.tierLabel} Green Collector` : 'Green Collector'}
              </p>
            </div>
          </div>

          {/* Track record — derived from live jobs, can't be faked */}
          <div className="mt-4 flex items-stretch rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <IdStat value={credential.pickups} label="Pickups" />
            <span className="my-3 w-px self-stretch" style={{ background: 'var(--border)' }} />
            <IdStat value={rating} label="Rating" />
            <span className="my-3 w-px self-stretch" style={{ background: 'var(--border)' }} />
            <IdStat value={memberSince(credential.memberSince)} label="Since" />
          </div>

          {/* Career ladder */}
          <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: FAINT }}>
            The Green Collector ladder
          </p>
          <Ladder credential={credential} />

          <button onClick={() => setView('guide')} className="tt-press mt-1 text-[12px] font-bold" style={{ color: 'var(--brand)' }}>
            How do I get certified? →
          </button>
        </div>
      )}
    </Sheet>
  )
}
