// Public marketing page for signed-out visitors. Full-width (it lifts the
// 430px app-shell cap via data-page="landing"), token-driven so it follows
// the active theme, and its hero art is the real TrashCard component — the
// product sells itself, and there's no screenshot to go stale.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TrashCard from './TrashCard'
import Button from './ui/Button'

const HERO_REQUEST = {
  id: 'landing-demo',
  photo: null,
  tags: ['Recyclable', 'Mixed'],
  status: 'open',
  gps: 'Brgy. Mabolo, Cebu City',
  price: 150,
  postedAt: new Date(Date.now() - 3600e3).toISOString(),
  likes: ['a', 'b', 'c'],
  postedBy: 'someone-else',
  collectedBy: null,
}

function useImpactStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    let cancelled = false
    supabase
      .from('requests')
      .select('status, price')
      .then(({ data }) => {
        if (cancelled || !data) return
        const paid = data.filter((r) => r.status === 'paid')
        setStats({
          cleaned: paid.length,
          paidOut: paid.reduce((s, r) => s + (Number(r.price) || 0), 0),
          open: data.filter((r) => r.status === 'open').length,
        })
      })
    return () => { cancelled = true }
  }, [])
  return stats
}

function Wordmark({ size = 24 }) {
  return (
    <span className="font-display leading-none" style={{ fontSize: size, fontWeight: 600 }}>
      <span style={{ color: 'var(--text-primary)' }}>Ko</span>
      <span style={{ color: 'var(--brand)' }}>lek</span>
    </span>
  )
}

function Step({ n, title, body }) {
  return (
    <div className="flex gap-3">
      <span
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
        style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)', color: 'var(--brand)' }}
      >
        {n}
      </span>
      <div>
        <p className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <p className="mt-0.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
      </div>
    </div>
  )
}

function Track({ label, steps }) {
  return (
    <div
      className="flex-1 p-6"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand)' }}>
        {label}
      </p>
      <div className="flex flex-col gap-5">
        {steps.map((s, i) => <Step key={s.title} n={i + 1} {...s} />)}
      </div>
    </div>
  )
}

function Audience({ label, title, body }) {
  return (
    <div
      className="flex-1 p-6"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--brand)' }}>
        {label}
      </p>
      <p className="mt-3 text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>{title}</p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{body}</p>
    </div>
  )
}

function ImpactStat({ value, label }) {
  return (
    <div className="text-center">
      <p className="font-display text-[38px] leading-none md:text-[48px]" style={{ fontWeight: 600 }}>
        {value ?? '—'}
      </p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ opacity: 0.6 }}>
        {label}
      </p>
    </div>
  )
}

export default function Landing({ onGetStarted, onLogIn }) {
  const stats = useImpactStats()

  // Lift the 430px app-shell cap while the landing page is mounted.
  useEffect(() => {
    document.documentElement.setAttribute('data-page', 'landing')
    return () => document.documentElement.removeAttribute('data-page')
  }, [])

  return (
    <div style={{ background: 'var(--surface)' }}>
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Wordmark />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onLogIn}>Log in</Button>
          <Button size="sm" onClick={onGetStarted}>Get started</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          <h1
            className="font-display text-[38px] leading-[1.08] md:text-[52px]"
            style={{ color: 'var(--text-primary)', fontWeight: 600 }}
          >
            Professional Green Collectors,<br />
            <span style={{ color: 'var(--brand)' }}>one trash at a time</span>.
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Malinis na barangay, powered by neighbors. Post the mess you can't deal with and a
            verified, rated Green Collector clears it, proves it with a photo, and gets paid —
            GCash, Maya, or cash, confirmed by both sides.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={onGetStarted} style={{ paddingBlock: 12, paddingInline: 22 }}>
              Get started — it's free
            </Button>
            <Button variant="secondary" onClick={onLogIn} style={{ paddingBlock: 12, paddingInline: 22 }}>
              Log in
            </Button>
          </div>
          <p className="mt-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            One account posts pickups and collects them.
          </p>
        </div>

        {/* Phone frame with the real card component */}
        <div className="flex justify-center md:justify-end">
          <div
            className="w-[320px] rotate-1 p-3 pt-6"
            style={{
              background: 'var(--brand-ink)',
              borderRadius: 34,
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            <div
              className="mx-auto mb-3 h-1.5 w-16 rounded-full"
              style={{ background: 'color-mix(in srgb, var(--on-brand-ink) 25%, transparent)' }}
            />
            <div className="overflow-hidden" style={{ borderRadius: 22, background: 'var(--surface)', padding: 10 }}>
              <TrashCard
                request={HERO_REQUEST}
                currentUserId="visitor"
                onAccept={onGetStarted}
                onLike={null}
                distanceMeters={1200}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="font-display mb-6 text-[26px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          How it works
        </h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <Track
            label="If you're posting"
            steps={[
              { title: 'Snap the mess', body: 'A photo, the spot on the map, what kind of trash it is.' },
              { title: 'Put a bounty on it', body: 'Name your price in pesos. Nearby Green Collectors see it instantly.' },
              { title: 'Review proof, then pay', body: 'See who accepted — verified, rated, with their pickups on record. Compare before/after photos, send GCash / Maya / cash, and mark it sent.' },
            ]}
          />
          <Track
            label="If you're collecting"
            steps={[
              { title: 'Accept a pickup nearby', body: 'The feed ranks open bounties by distance, freshness, and payout.' },
              { title: 'Clean it and prove it', body: 'Live location sharing on the way; an after-photo when it’s done.' },
              { title: 'Build your credential', body: 'Every job and every star builds your Green Collector ID — get paid, get rated, climb the ladder.' },
            ]}
          />
        </div>
      </section>

      {/* Who Kolek serves — the workforce is the product */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="font-display mb-6 text-[26px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          A workforce, not just an app
        </h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <Audience
            label="For Green Collectors"
            title="A profession with a ladder"
            body="Dignified, flexible income with a real career path — Verified → Certified → Top-Rated → Team Lead → Barangay Coordinator. Status and progression, not just piece-rate pay."
          />
          <Audience
            label="For homeowners"
            title="A professional at your gate"
            body="Not a stranger on a motorbike — an identity-verified neighbor, rated on every job, with a credential you can see before they arrive."
          />
          <Audience
            label="For your barangay"
            title="A green-jobs corps"
            body="A certified, uniformed collection workforce that fills the gap without expanding the municipal budget — plus the waste-hotspot picture to govern with."
          />
        </div>
      </section>

      {/* Live impact — real numbers; before the first pickup it's a launch call instead of sad zeros */}
      <section style={{ background: 'var(--brand-ink)', color: 'var(--on-brand-ink)' }}>
        {stats && stats.cleaned === 0 && stats.open === 0 ? (
          <div className="mx-auto max-w-5xl px-5 py-12 text-center">
            <p className="font-display text-[28px] md:text-[34px]" style={{ fontWeight: 600 }}>
              The board is clean. For now.
            </p>
            <p className="mx-auto mt-2 max-w-md text-[14px]" style={{ opacity: 0.65 }}>
              Every number here will be real — pickups cleaned, pesos paid out. Post the first
              bounty in your barangay and start the count.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-around gap-8 px-5 py-12">
            <ImpactStat value={stats?.cleaned} label="Pickups cleaned" />
            <ImpactStat value={stats ? `₱${stats.paidOut}` : null} label="Paid to Green Collectors" />
            <ImpactStat value={stats?.open} label="Open bounties right now" />
          </div>
        )}
      </section>

      {/* Community strip + closing CTA */}
      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h2 className="font-display text-[26px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          More than a marketplace
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          A community feed for cleanup events and local news, a leaderboard for the neighborhood's
          top Green Collectors, live tracking while your collector is on the way, and chat on every
          pickup.
        </p>
        <Button className="mt-7" onClick={onGetStarted} style={{ paddingBlock: 13, paddingInline: 28 }}>
          Join Kolek
        </Button>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
          <Wordmark size={18} />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            Malinis na barangay, powered by neighbors
          </p>
        </div>
      </footer>
    </div>
  )
}
