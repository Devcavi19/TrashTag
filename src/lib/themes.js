// App-wide themes. Each preset defines the full design-token set as CSS
// variables; switching a theme rewrites them on <html>, so every token-driven
// style re-skins at once. Themes carry a `dark` flag so consumers that can't
// use tokens directly (Leaflet tiles, photo overlays, tag chips) can adapt —
// applyTheme mirrors it as a `data-dark` attribute on <html>.

import { TAG_TOKENS } from './tagColors'

export const THEMES = {
  'fresh-canopy': {
    name: 'Fresh Canopy',
    blurb: 'Airy greens, soft cards — the Linisa look',
    dark: false,
    swatch: ['#2fa96a', '#173d2b'],
    tokens: {
      '--surface': '#f7f9f5',
      '--surface-card': '#ffffff',
      '--surface-raised': '#ffffff',
      '--text-primary': '#1c2b22',
      '--text-secondary': '#5b6b5f',
      '--text-muted': '#8a978d',
      '--border': '#e6ebe4',
      '--brand': '#2fa96a',
      '--on-brand': '#ffffff',
      '--brand-ink': '#173d2b',
      '--on-brand-ink': '#ffffff',
      '--accent': '#d98b2b',
      '--success': '#1f7a4d',
      '--warning': '#a16b1f',
      '--danger': '#c8502e',
      '--radius-card': '16px',
      '--radius-control': '12px',
      '--shadow-card': '0 2px 8px rgba(23, 61, 43, 0.07)',
      '--shadow-raised': '0 8px 30px rgba(23, 61, 43, 0.16)',
    },
  },
  'bold-impact': {
    name: 'Bold Impact',
    blurb: 'Dark forest, electric lime',
    dark: true,
    swatch: ['#a3ff6b', '#101613'],
    tokens: {
      '--surface': '#101613',
      '--surface-card': '#1a231d',
      '--surface-raised': '#161e19',
      '--text-primary': '#eaffe9',
      '--text-secondary': '#8fa397',
      '--text-muted': '#67786d',
      '--border': '#26332a',
      '--brand': '#a3ff6b',
      '--on-brand': '#101613',
      '--brand-ink': '#a3ff6b',
      '--on-brand-ink': '#101613',
      '--accent': '#e3c67b',
      '--success': '#7be3a4',
      '--warning': '#e3c67b',
      '--danger': '#ff7a5c',
      '--radius-card': '14px',
      '--radius-control': '8px',
      '--shadow-card': 'none',
      '--shadow-raised': '0 8px 30px rgba(0, 0, 0, 0.5)',
    },
  },
}

export const DEFAULT_THEME = 'fresh-canopy'

const STORAGE_KEY = 'linisa-theme'

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
