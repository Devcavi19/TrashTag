// The "You" section — a full-screen field record, not a dropdown. Everything
// here is derived from live requests; nothing is a vanity number.
import { useState } from 'react'
import { TAG_COLORS } from '../lib/tagColors'
import { THEMES } from '../lib/themes'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import { Input } from './ui/Input'
import CredentialSheet, { VerifiedBadge } from './CredentialSheet'
import GuidelinesSheet from './GuidelinesSheet'
import AccountSheet from './AccountSheet'
import NotificationsSheet from './NotificationsSheet'

const INK = 'var(--text-primary)'
const MUTED = 'var(--text-secondary)'
const FAINT = 'var(--text-muted)'
const LINE = 'var(--border)'

const CARD_STYLE = {
  background: 'var(--surface-card)',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-card)',
}

const CATEGORIES = Object.keys(TAG_COLORS) // canonical order: Bio / Recyclable / Residual / Mixed

// Your title is what you've done, not a setting — and once you're verified,
// it's your credential.
function deriveTitle({ posted, collected }, credential) {
  if (credential?.verified) return `${credential.tierLabel} Green Collector`
  if (collected > 0 && collected >= posted) return 'Green Collector'
  if (posted > 0) return 'Poster'
  return 'New member'
}

function memberSince(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString([], { month: 'long', year: 'numeric' })
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 py-3.5">
      <span className="font-display text-[24px] leading-none" style={{ color: 'var(--brand)', fontWeight: 600 }}>
        {value}
      </span>
      <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
        {label}
      </span>
    </div>
  )
}

function ActionRow({ icon, label, hint, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'color-mix(in srgb, var(--text-primary) 4%, transparent)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center" style={{ color: danger ? 'var(--danger)' : MUTED }}>
        {icon}
      </span>
      <span className="flex-1 text-[14px] font-semibold" style={{ color: danger ? 'var(--danger)' : INK }}>
        {label}
      </span>
      {hint && (
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
          style={{ background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)', color: FAINT }}
        >
          {hint}
        </span>
      )}
      {!danger && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </button>
  )
}

// Where posters send your money — shown to them in the pay sheet when they
// settle a pickup you collected.
function PaymentDetails({ profile, onSave }) {
  const [gcash, setGcash] = useState(profile?.gcash_number ?? '')
  const [maya, setMaya] = useState(profile?.maya_number ?? '')
  const [saving, setSaving] = useState(false)

  const dirty = gcash !== (profile?.gcash_number ?? '') || maya !== (profile?.maya_number ?? '')

  async function save() {
    if (!dirty || saving) return
    setSaving(true)
    await onSave({ gcash, maya })
    setSaving(false)
  }

  return (
    <section className="p-4" style={CARD_STYLE}>
      <div className="flex items-center gap-2">
        <span className="flex h-[18px] w-[18px] items-center justify-center" style={{ color: MUTED }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </span>
        <h2 className="font-display text-[15px]" style={{ color: 'var(--brand)', fontWeight: 600 }}>Payment details</h2>
      </div>
      <p className="mt-1 text-[12px]" style={{ color: FAINT }}>
        Posters see these in the pay sheet when they settle a pickup you collected.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <Input
          label="GCash number"
          value={gcash}
          onChange={(e) => setGcash(e.target.value)}
          placeholder="09xx xxx xxxx"
          inputMode="tel"
          maxLength={20}
        />
        <Input
          label="Maya number"
          value={maya}
          onChange={(e) => setMaya(e.target.value)}
          placeholder="09xx xxx xxxx"
          inputMode="tel"
          maxLength={20}
        />
        <Button full disabled={!dirty} loading={saving} onClick={save}>
          Save payment details
        </Button>
      </div>
    </section>
  )
}

// Theme picker — swatches always show each theme's own colors so their identity
// reads regardless of which one is active; the active ring uses the live accent.
function ThemePicker({ current, onChange }) {
  return (
    <section className="p-4" style={CARD_STYLE}>
      <div className="flex items-center gap-2">
        <span className="flex h-[18px] w-[18px] items-center justify-center" style={{ color: MUTED }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.012 17.5 2 12 2z" />
          </svg>
        </span>
        <h2 className="font-display text-[15px]" style={{ color: 'var(--brand)', fontWeight: 600 }}>Appearance</h2>
      </div>
      <p className="mt-1 text-[12px]" style={{ color: FAINT }}>
        Pick the color theme for the whole app.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {Object.entries(THEMES).map(([id, t]) => {
          const active = id === current
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="tt-press relative flex flex-col items-center gap-2 rounded-xl px-2 py-3"
              style={{
                background: active ? 'color-mix(in srgb, var(--text-primary) 4%, transparent)' : 'transparent',
                boxShadow: active ? '0 0 0 2px var(--accent)' : '0 0 0 1px var(--border)',
              }}
              aria-pressed={active}
              title={t.blurb}
            >
              <span className="flex h-9 w-9 overflow-hidden rounded-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.18)' }}>
                <span className="h-full w-1/2" style={{ background: t.swatch[0] }} />
                <span className="h-full w-1/2" style={{ background: t.swatch[1] }} />
              </span>
              <span className="text-[11px] font-bold" style={{ color: INK }}>{t.name}</span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'var(--accent)', color: '#ffffff' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function ProfileView({ currentUser, profile, requests, stats, onLogout, onSavePaymentDetails, onUploadAvatar, onSaveName, onChangeEmail, onChangePassword, notificationPrefs, onSaveNotificationPrefs, credentialFor, theme, onThemeChange }) {
  const myId = currentUser?.id
  const myCred = credentialFor?.(myId) ?? null
  const title = deriveTitle(stats, myCred?.credential)
  const rating = stats.ratingCount > 0 ? stats.rating.toFixed(1) : '—'
  const since = memberSince(currentUser?.created_at)
  const [idOpen, setIdOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Real money moved: what you've paid out as a poster + earned as a collector.
  const completedMine = requests.filter(
    (r) => (r.postedBy === myId || r.collectedBy === myId) && ['collected', 'paid'].includes(r.status)
  )
  const earned = requests
    .filter((r) => r.collectedBy === myId && r.status === 'paid')
    .reduce((sum, r) => sum + (Number(r.price) || 0), 0)

  // Cleanup composition — tally the trash categories you've helped clear.
  const tally = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const r of completedMine) {
    for (const tag of r.tags || []) {
      if (tag in tally) tally[tag] += 1
    }
  }
  const totalTags = CATEGORIES.reduce((s, c) => s + tally[c], 0)
  const segments = CATEGORIES.filter((c) => tally[c] > 0)

  return (
    <div className="pb-6">
      {/* Identity hero — brand ink panel, on-brand text */}
      <div className="px-4 pb-5 pt-5" style={{ background: 'var(--brand-ink)', color: 'var(--on-brand-ink)' }}>
        <div className="flex items-center gap-4">
          <Avatar name={currentUser?.name || 'You'} src={profile?.avatar_url} size="lg" className="flex-shrink-0 text-xl" style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 truncate font-display text-[22px] leading-tight" style={{ fontWeight: 600 }}>
              <span className="truncate">{currentUser?.name || 'You'}</span>
              {myCred?.credential?.verified && <VerifiedBadge size={17} />}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{
                  background: 'color-mix(in srgb, var(--on-brand-ink) 16%, transparent)',
                }}
              >
                {title}
              </span>
              {since && (
                <span className="text-[11px] font-medium" style={{ opacity: 0.55 }}>
                  Member since {since}
                </span>
              )}
            </div>
          </div>
        </div>
        {currentUser?.email && (
          <p className="mt-3 truncate text-[12px]" style={{ opacity: 0.5 }}>
            {currentUser.email}
          </p>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Impact ledger */}
        <section className="overflow-hidden" style={CARD_STYLE}>
          <p className="px-4 pt-3 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: FAINT }}>
            Impact ledger
          </p>
          <div className="flex items-stretch px-1">
            <Stat value={stats.posted} label="Posted" />
            <span className="my-3.5 w-px self-stretch" style={{ background: LINE }} />
            <Stat value={stats.collected} label="Collected" />
            <span className="my-3.5 w-px self-stretch" style={{ background: LINE }} />
            <Stat value={`₱${earned}`} label="Earned" />
            <span className="my-3.5 w-px self-stretch" style={{ background: LINE }} />
            <Stat value={rating} label="Rating" />
          </div>
        </section>

        {/* Cleanup record — the signature: real trash categories you've cleared */}
        <section className="p-4" style={CARD_STYLE}>
          <h2 className="font-display text-[15px]" style={{ color: 'var(--brand)', fontWeight: 600 }}>
            What you've helped clear
          </h2>

          {totalTags === 0 ? (
            <p className="mt-2 text-[13px]" style={{ color: FAINT }}>
              No pickups completed yet. Post a job or collect one, and the trash you clear shows up here by type.
            </p>
          ) : (
            <>
              <div
                className="mt-3 flex h-3 w-full overflow-hidden rounded-full"
                style={{ background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)' }}
              >
                {segments.map((c) => (
                  <div
                    key={c}
                    style={{ width: `${(tally[c] / totalTags) * 100}%`, background: TAG_COLORS[c].color }}
                  />
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-y-2">
                {segments.map((c) => (
                  <div key={c} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: TAG_COLORS[c].color }} />
                    <span className="text-[12px] font-medium" style={{ color: INK }}>{TAG_COLORS[c].label}</span>
                    <span className="text-[12px] font-bold" style={{ color: MUTED }}>{tally[c]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Payment details — where posters send your money */}
        <PaymentDetails key={`${profile?.gcash_number ?? ''}|${profile?.maya_number ?? ''}`} profile={profile} onSave={onSavePaymentDetails} />

        {/* Appearance — theme switcher, applies app-wide */}
        <ThemePicker current={theme} onChange={onThemeChange} />

        {/* Account actions */}
        <section className="overflow-hidden" style={CARD_STYLE}>
          <ActionRow
            label="My Green Collector ID"
            hint={myCred?.credential?.verified ? 'Verified' : undefined}
            onClick={() => setIdOpen(true)}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h4" /><path d="M15 12h4" /><path d="M5.5 16.5c.5-1.5 2-2.5 3.5-2.5s3 1 3.5 2.5" />
              </svg>
            }
          />
          <div className="h-px" style={{ background: LINE }} />
          <ActionRow
            label="Account settings"
            onClick={() => setAcctOpen(true)}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
          />
          <div className="h-px" style={{ background: LINE }} />
          <ActionRow
            label="Notifications"
            onClick={() => setNotifOpen(true)}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            }
          />
          <div className="h-px" style={{ background: LINE }} />
          <ActionRow
            label="Community guidelines"
            onClick={() => setGuideOpen(true)}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            }
          />
        </section>

        <section className="overflow-hidden" style={CARD_STYLE}>
          <ActionRow
            danger
            label="Sign out"
            onClick={onLogout}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
              </svg>
            }
          />
        </section>

        <p className="pt-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: FAINT }}>
          Linisa
        </p>
      </div>

      {myCred && (
        <CredentialSheet open={idOpen} onClose={() => setIdOpen(false)} profile={myCred.profile} credential={myCred.credential} />
      )}

      <GuidelinesSheet open={guideOpen} onClose={() => setGuideOpen(false)} />

      <AccountSheet
        open={acctOpen}
        onClose={() => setAcctOpen(false)}
        currentUser={currentUser}
        profile={profile}
        onUploadAvatar={onUploadAvatar}
        onSaveName={onSaveName}
        onChangeEmail={onChangeEmail}
        onChangePassword={onChangePassword}
      />

      {/* key remounts the sheet when saved prefs round-trip, keeping local
          state in sync (same pattern as PaymentDetails) */}
      <NotificationsSheet
        key={JSON.stringify(notificationPrefs)}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        prefs={notificationPrefs}
        onSave={onSaveNotificationPrefs}
      />
    </div>
  )
}
