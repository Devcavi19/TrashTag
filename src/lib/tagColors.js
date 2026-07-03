// Canonical color mapping for trash-type tags. Reused anywhere a tag needs a
// color (StatusBadge, PostForm pills, TrashCard strip). Values are CSS
// variables so chips re-skin live on theme switch; the per-theme values live
// below and are applied by lib/themes.js alongside the core tokens.
export const TAG_COLORS = {
  Biodegradable: { label: 'Biodegradable', bg: 'var(--tag-bio-bg)', color: 'var(--tag-bio-fg)' },
  Recyclable:    { label: 'Recyclable',    bg: 'var(--tag-rec-bg)', color: 'var(--tag-rec-fg)' },
  Residual:      { label: 'Residual',      bg: 'var(--tag-res-bg)', color: 'var(--tag-res-fg)' },
  Mixed:         { label: 'Mixed',         bg: 'var(--tag-mix-bg)', color: 'var(--tag-mix-fg)' },
}

// Per-theme chip palettes: soft tinted backgrounds with deep text on light
// themes; translucent tints with bright text on dark ones.
export const TAG_TOKENS = {
  light: {
    '--tag-bio-bg': '#eaf5ec', '--tag-bio-fg': '#22863a',
    '--tag-rec-bg': '#e8f0fe', '--tag-rec-fg': '#1966b5',
    '--tag-res-bg': '#fce8e6', '--tag-res-fg': '#b53419',
    '--tag-mix-bg': '#f3f0fb', '--tag-mix-fg': '#6b46c1',
  },
  dark: {
    '--tag-bio-bg': 'rgba(123, 227, 164, 0.14)', '--tag-bio-fg': '#7be3a4',
    '--tag-rec-bg': 'rgba(122, 186, 255, 0.14)', '--tag-rec-fg': '#7abaff',
    '--tag-res-bg': 'rgba(255, 138, 108, 0.14)', '--tag-res-fg': '#ff8a6c',
    '--tag-mix-bg': 'rgba(196, 165, 255, 0.14)', '--tag-mix-fg': '#c4a5ff',
  },
}
