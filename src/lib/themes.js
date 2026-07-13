// App-wide themes — currently a single theme. The mechanism stays in place so
// a night variant can return later. Each preset defines the full design-token
// set as CSS variables; switching a theme rewrites them on <html>, so every
// token-driven style re-skins at once. Themes carry a `dark` flag so consumers
// that can't use tokens directly (Leaflet tiles, photo overlays, tag chips)
// can adapt — applyTheme mirrors it as a `data-dark` attribute on <html>.

import { TAG_TOKENS } from './tagColors'

export const THEMES = {
  'eco-premium': {
    name: 'Eco-Premium',
    blurb: 'Forest ink, warm cream, gold — the Kolek look',
    dark: false,
    swatch: ['#12291c', '#e9c46a'],
    tokens: {
      '--surface': '#f4efe6',
      '--surface-card': '#fffdf7',
      '--surface-raised': '#fffdf7',
      '--surface-ink': '#0e2016',
      '--text-primary': '#12291c',
      '--text-secondary': '#5d6b60',
      '--text-muted': '#8a8371',
      '--text-on-ink': '#f4efe6',
      '--text-on-ink-muted': '#9db8a6',
      '--border': '#e3dccb',
      '--border-ink': '#2a5238',
      '--brand': '#1f5136',
      '--on-brand': '#f4efe6',
      '--brand-ink': '#12291c',
      '--on-brand-ink': '#f4efe6',
      '--accent': '#e9c46a',
      '--on-accent': '#12291c',
      '--live-dot': '#7dd6a0',
      '--success': '#2a7a4b',
      '--warning': '#c98a1b',
      '--danger': '#b3423a',
      '--radius-card': '16px',
      '--radius-control': '12px',
      '--shadow-card': '0 2px 10px rgba(18, 41, 28, 0.08)',
      '--shadow-raised': '0 10px 34px rgba(18, 41, 28, 0.18)',
    },
  },
}

export const DEFAULT_THEME = 'eco-premium'

const STORAGE_KEY = 'kolek-theme'

export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME]
  const root = document.documentElement
  const tokens = { ...theme.tokens, ...TAG_TOKENS[theme.dark ? 'dark' : 'light'] }
  for (const [token, value] of Object.entries(tokens)) {
    root.style.setProperty(token, value)
  }
  if (theme.dark) {
    root.setAttribute('data-dark', 'true')
  } else {
    root.removeAttribute('data-dark')
  }
}

export function isDarkTheme(id) {
  return Boolean((THEMES[id] || THEMES[DEFAULT_THEME]).dark)
}

export function getStoredTheme() {
  try {
    const id = localStorage.getItem(STORAGE_KEY)
    return id && THEMES[id] ? id : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function setStoredTheme(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore — theme just won't persist (e.g. private mode)
  }
}

// Apply the persisted theme before first paint (called from main.jsx).
export function initTheme() {
  applyTheme(getStoredTheme())
}
