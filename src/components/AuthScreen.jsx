import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'confirm'

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupError, setSignupError] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    setLoginLoading(false)

    if (error) {
      setLoginError(error.message)
      return
    }

    onLogin(data.user)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setSignupError('')

    if (!signupName.trim()) return setSignupError('Name is required.')
    if (signupPassword.length < 6) return setSignupError('Password must be at least 6 characters.')
    if (signupPassword !== signupConfirm) return setSignupError('Passwords do not match.')

    setSignupLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        data: {
          name: signupName.trim(),
        },
      },
    })

    setSignupLoading(false)

    if (error) {
      const msg = error.message && error.message !== '{}'
        ? error.message
        : error.status >= 500
          ? 'Sign up is temporarily unavailable. Please try again later.'
          : 'Sign up failed. Please try again.'
      setSignupError(msg)
      return
    }

    // Email confirmation required — no session yet
    if (!data.session) {
      setMode('confirm')
      return
    }

    onLogin(data.user)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: '#f3f4f2' }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mb-3"
          style={{ background: '#0d3320' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
              stroke="#c97f1e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11v5M14 11v5"
              stroke="#c97f1e"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="font-display text-3xl" style={{ color: '#0d3320', fontWeight: 600 }}>
          TrashTag <span style={{ color: '#c97f1e' }} className="text-base font-sans font-semibold align-middle">PH</span>
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-[390px] bg-white rounded-2xl shadow-sm p-6">

        {/* Email confirmation pending */}
        {mode === 'confirm' && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="text-4xl">📬</div>
            <h2 className="font-bold text-lg" style={{ color: '#0d3320' }}>Check your email</h2>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              We sent a confirmation link to your email address. Click it to activate your account, then log in below.
            </p>
            <button
              onClick={() => setMode('login')}
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-2"
              style={{ background: '#0d3320' }}
            >
              Go to Log In
            </button>
          </div>
        )}

        {/* Tab toggle + forms — hidden on confirm screen */}
        {mode !== 'confirm' && (
        <>
        <div
          className="flex rounded-xl mb-6 p-1"
          style={{ background: '#f3f4f2' }}
        >
          {['login', 'signup'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setMode(tab)
                setLoginError('')
                setSignupError('')
              }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
              style={
                mode === tab
                  ? { background: '#0d3320', color: 'white' }
                  : { color: '#6b7280' }
              }
            >
              {tab === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', '--tw-ring-color': '#0d3320' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', '--tw-ring-color': '#0d3320' }}
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-500 text-center">{loginError}</p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-1"
              style={{ background: '#0d3320', opacity: loginLoading ? 0.7 : 1 }}
            >
              {loginLoading ? 'Logging in…' : 'Log In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                Full Name
              </label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Juan Dela Cruz"
                required
                className="border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', '--tw-ring-color': '#0d3320' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                Email
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', '--tw-ring-color': '#0d3320' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', '--tw-ring-color': '#0d3320' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{ borderColor: '#e5e7eb', '--tw-ring-color': '#0d3320' }}
              />
            </div>

            <p className="text-[11px] leading-snug" style={{ color: '#9aa0a6' }}>
              One account does it all — post pickups and collect them whenever you like.
            </p>

            {signupError && (
              <p className="text-xs text-red-500 text-center">{signupError}</p>
            )}

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-1"
              style={{ background: '#c97f1e', opacity: signupLoading ? 0.7 : 1 }}
            >
              {signupLoading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}
        </>
        )}
      </div>
    </div>
  )
}
