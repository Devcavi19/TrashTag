// App-wide color themes. Each preset maps to three CSS variables that the whole
// UI is wired to (--brand, --brand-accent, --app-bg). Switching a theme just
// rewrites those variables on <html>, so every inline style re-skins at once.
// Presets are intentionally all light-background so the app's white cards stay
// legible; only the brand chrome (top bar, nav, hero, headings, accents) changes.

export const THEMES = {
  forest: {
    name: 'Forest',
    blurb: 'The TrashTag original',
    brand: '#0d3320',
    accent: '#c97f1e',
    bg: '#f3f4f2',
    swatch: ['#0d3320', '#c97f1e'],
  },
  grab: {
    name: 'Grab',
    blurb: 'Bright super-app green',
    brand: '#00a04a',
    accent: '#ffb020',
    bg: '#f1f7f2',
    swatch: ['#00b14f', '#ffb020'],
  },
  midnight: {
    name: 'Midnight',
    blurb: 'Deep navy & ember',
    brand: '#14213d',
    accent: '#fca311',
    bg: '#f2f3f6',
    swatch: ['#14213d', '#fca311'],
  },
}

export const DEFAULT_THEME = 'forest'

const STORAGE_KEY = 'trashtag-theme'

export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME]
  const root = document.documentElement.style
  root.setProperty('--brand', theme.brand)
  root.setProperty('--brand-accent', theme.accent)
  root.setProperty('--app-bg', theme.bg)
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
