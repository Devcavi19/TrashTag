import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Grab-inspired palette
const GRAB_GREEN = '#00B14F'
const GRAB_GREEN_DARK = '#00843B'
const INK = '#1A1A1A'
const MUTED = '#6B7280'
const FIELD_BG = '#F5F6F7'
const FIELD_BORDER = '#E8E9EB'

function getLoginErrorMessage(error) {
  if (!error) return 'Login failed. Please try again.'
  if (error.status === 400 || error.message?.includes('credentials')) {
    return 'Invalid email or password.'
  }
  if (error.status === 429) {
    return 'Too many login attempts. Please try again later.'
  }
  if (error.status >= 500) {
    return 'Login service temporarily unavailable. Please try again later.'
  }
  return 'Login failed. Please try again.'
}

const MIN_PASSWORD_LENGTH = 8

// Mirror the server-side policy as closely as the client can. The real
// enforcement is the Supabase dashboard password policy; this is UX + a first
// line of defence. Returns an error string, or null when the password is valid.
function getPasswordError(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include upper- and lower-case letters and a number.'
  }
  return null
}

function getSignupErrorMessage(error) {
  if (!error) return 'Sign up failed. Please try again.'
  if (error.message?.includes('User already registered') || error.message?.includes('email')) {
    return 'That email address is already in use.'
  }
  if (error.status === 429) {
    return 'Too many sign-up attempts. Please try again later.'
  }
  if (error.status >= 500) {
    return 'Sign up service temporarily unavailable. Please try again later.'
  }
  return 'Sign up failed. Please try again.'
}

// Shared field styling — soft filled inputs, green focus ring (Grab style).
const fieldBase =
  'w-full rounded-xl px-4 py-3.5 text-[15px] outline-none transition-shadow focus:ring-2'
const fieldStyle = {
  background: FIELD_BG,
  border: `1px solid ${FIELD_BORDER}`,
  color: INK,
  '--tw-ring-color': GRAB_GREEN,
}

function Field({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold" style={{ color: INK }}>
        {label}
      </label>
      <input className={fieldBase} style={fieldStyle} {...props} />
    </div>
  )
}

export default function AuthScreen({ onLogin, notice }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'confirm'
  const [showNotice, setShowNotice] = useState(true)

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
      setLoginError(getLoginErrorMessage(error))
      return
    }

    onLogin(data.user)
  }

  async function handleSignup(e) {
    e.preventDefault()
    setSignupError('')

    if (!signupName.trim()) return setSignupError('Name is required.')
    const passwordError = getPasswordError(signupPassword)
    if (passwordError) return setSignupError(passwordError)
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
      setSignupError(getSignupErrorMessage(error))
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
      className="min-h-screen flex flex-col px-6 pt-14 pb-8"
      style={{ background: '#ffffff' }}
    >
      {/* Brand mark — Grab-style "two solid bars" motif in a green tile */}
      <div className="flex items-center gap-3 mb-9">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: GRAB_GREEN }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="6" width="16" height="3.4" rx="1.7" fill="white" />
            <rect x="4" y="14.6" width="16" height="3.4" rx="1.7" fill="white" fillOpacity="0.75" />
          </svg>
        </div>
        <span className="text-[22px] font-bold tracking-tight" style={{ color: INK }}>
          TrashTag
        </span>
      </div>

      {/* Email confirmation pending */}
      {mode === 'confirm' ? (
        <div className="flex flex-col gap-5 pt-4">
          <div className="text-5xl">📬</div>
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold leading-tight" style={{ color: INK }}>
              Check your email
            </h1>
            <p className="text-[15px] leading-relaxed" style={{ color: MUTED }}>
              We sent a confirmation link to your inbox. Tap it to activate your account, then log in
              below.
            </p>
          </div>
          <button
            onClick={() => setMode('login')}
            className="w-full py-3.5 rounded-xl font-bold text-[15px] text-white mt-2 transition-colors"
            style={{ background: GRAB_GREEN }}
            onMouseDown={(e) => (e.currentTarget.style.background = GRAB_GREEN_DARK)}
            onMouseUp={(e) => (e.currentTarget.style.background = GRAB_GREEN)}
          >
            Go to log in
          </button>
        </div>
      ) : (
        <>
          {/* Greeting */}
          <div className="flex flex-col gap-1.5 mb-7">
            <h1 className="text-[28px] font-bold leading-tight" style={{ color: INK }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-[15px]" style={{ color: MUTED }}>
              {mode === 'login'
                ? 'Log in to post pickups and collect trash.'
                : 'One account posts pickups and collects them.'}
            </p>
          </div>

          {notice && showNotice && (
            <div
              className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5 text-[13px]"
              style={{ background: '#ECFBF2', border: '1px solid #B9EBCE', color: GRAB_GREEN_DARK }}
            >
              <span className="mt-px">⏱️</span>
              <span className="flex-1">{notice}</span>
              <button
                onClick={() => setShowNotice(false)}
                className="font-bold leading-none"
                style={{ color: GRAB_GREEN }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          {/* Segmented toggle */}
          <div
            className="flex rounded-full mb-7 p-1"
            style={{ background: FIELD_BG, border: `1px solid ${FIELD_BORDER}` }}
          >
            {['login', 'signup'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab)
                  setLoginError('')
                  setSignupError('')
                }}
                className="flex-1 py-2.5 rounded-full text-[14px] font-bold transition-all"
                style={
                  mode === tab
                    ? { background: GRAB_GREEN, color: 'white', boxShadow: '0 1px 3px rgba(0,177,79,0.35)' }
                    : { color: MUTED, background: 'transparent' }
                }
              >
                {tab === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Field
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Field
                label="Password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              {loginError && <p className="text-[13px] text-red-500">{loginError}</p>}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] text-white mt-2 transition-colors"
                style={{ background: GRAB_GREEN, opacity: loginLoading ? 0.7 : 1 }}
                onMouseDown={(e) => !loginLoading && (e.currentTarget.style.background = GRAB_GREEN_DARK)}
                onMouseUp={(e) => (e.currentTarget.style.background = GRAB_GREEN)}
              >
                {loginLoading ? 'Logging in…' : 'Log in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <Field
                label="Full name"
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="Juan Dela Cruz"
                required
              />
              <Field
                label="Email"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <Field
                label="Password"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="8+ chars, mixed case & a number"
                required
              />
              <Field
                label="Confirm password"
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="Re-enter your password"
                required
              />

              {signupError && <p className="text-[13px] text-red-500">{signupError}</p>}

              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] text-white mt-2 transition-colors"
                style={{ background: GRAB_GREEN, opacity: signupLoading ? 0.7 : 1 }}
                onMouseDown={(e) => !signupLoading && (e.currentTarget.style.background = GRAB_GREEN_DARK)}
                onMouseUp={(e) => (e.currentTarget.style.background = GRAB_GREEN)}
              >
                {signupLoading ? 'Creating account…' : 'Create account'}
              </button>

              <p className="text-[12px] leading-snug text-center mt-1" style={{ color: MUTED }}>
                By continuing you agree to keep our neighborhoods clean. 🌱
              </p>
            </form>
          )}
        </>
      )}
    </div>
  )
}
