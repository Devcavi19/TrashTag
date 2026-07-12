// Community guidelines — static trust charter. Structure follows the standard
// marketplace pattern: mission intro → numbered principles → reporting →
// enforcement ladder.
import Sheet from './ui/Sheet'

const PRINCIPLES = [
  {
    title: 'Respect every member',
    body: 'Green Collectors are professionals. No harassment, discrimination, or insults in chat or posts.',
  },
  {
    title: 'Post honestly',
    body: 'Real photos of the actual trash, accurate category tags, and a fair offer for the work involved.',
  },
  {
    title: 'Collect with integrity',
    body: 'After-photos must show the same site, actually cleared. Only accept jobs you intend to finish.',
  },
  {
    title: 'Pay fairly and promptly',
    body: 'Honor the payment handshake — send what you offered, confirm what you received.',
  },
  {
    title: 'Stay safe out there',
    body: 'Wear gloves, prefer daylight pickups, and watch for traffic and sharp objects. Skip anything hazardous and report it instead.',
  },
  {
    title: 'Dispose responsibly',
    body: 'Segregate by category and use proper barangay disposal points, in the spirit of RA 9003.',
  },
]

function Footnote({ heading, children }) {
  return (
    <div className="mt-4">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        {heading}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </p>
    </div>
  )
}

export default function GuidelinesSheet({ open, onClose }) {
  return (
    <Sheet open={open} title="Community guidelines" onClose={onClose}>
      <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        Kolek works because strangers trust each other with real money and real work.
        These guidelines keep that trust.
      </p>

      <ol className="mt-4 space-y-3.5">
        {PRINCIPLES.map((p, i) => (
          <li key={p.title} className="flex gap-3">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{
                background: 'color-mix(in srgb, var(--brand) 14%, transparent)',
                color: 'var(--brand)',
              }}
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {p.title}
              </span>
              <span className="mt-0.5 block text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {p.body}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 h-px" style={{ background: 'var(--border)' }} />

      <Footnote heading="Reporting">
        For a job gone wrong, use the review and dispute steps in the pickup chat.
        For behavior that breaks these guidelines, contact the Kolek team.
      </Footnote>

      <Footnote heading="Enforcement">
        Breaking these guidelines leads to a warning, then temporary suspension,
        then removal — depending on severity. We&apos;ll always tell you why.
      </Footnote>
    </Sheet>
  )
}
