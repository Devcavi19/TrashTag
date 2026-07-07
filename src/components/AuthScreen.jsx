import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'
import Card from './ui/Card'
import { Input } from './ui/Input'
import BrandMark from './BrandMark'

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

function FormError({ children }) {
  if (!children) return null
  return (
    <p className="text-[13px] font-medium" style={{ color: 'var(--danger)' }} role="alert">
      {children}
    </p>
  )
}

export default function AuthScreen({ onLogin, notice, initialMode = 'login', onBack }) {
  const [mode, setMode] = useState(initialMode) // 'login' | 'signup' | 'confirm'
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
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-6" style={{ background: 'var(--surface)' }}>
      {onBack && (
        <button
          onClick={onBack}
          className="tt-press mb-4 flex items-center gap-1 self-start text-[13px] font-semibold"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>
      )}
      {/* Brand hero */}
      <div className="mb-8 flex flex-col items-start gap-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: 'var(--brand-ink)', color: 'var(--on-brand-ink)' }}
        >
          <BrandMark size={30} />
        </div>
        <div>
          <span className="font-display text-[30px] leading-none" style={{ fontWeight: 600 }}>
            <span style={{ color: 'var(--text-primary)' }}>Lin</span>
            <span style={{ color: 'var(--brand)' }}>isa</span>
          </span>
          <p className="mt-1.5 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
            Professional Green Collectors, one trash at a time.
          </p>
        </div>
      </div>

      {/* Email confirmation pending */}
      {mode === 'confirm' ? (
        <Card className="p-6">
          <div className="flex flex-col gap-5">
            <div className="text-5xl">📬</div>
            <div className="flex flex-col gap-2">
              <h1 className="text-[24px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Check your email
              </h1>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We sent a confirmation link to your inbox. Tap it to activate your account, then log
                in below.
              </p>
            </div>
            <Button full onClick={() => setMode('login')} style={{ paddingBlock: 12 }}>
              Go to log in
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {notice && showNotice && (
            <div
              className="mb-5 flex items-start gap-2 rounded-xl px-4 py-3 text-[13px]"
              style={{
                background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--brand) 30%, transparent)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="mt-px">⏱️</span>
              <span className="flex-1">{notice}</span>
              <button
                onClick={() => setShowNotice(false)}
                className="font-bold leading-none"
                style={{ color: 'var(--brand)' }}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}

          <Card className="p-5">
            {/* Greeting */}
            <div className="mb-5 flex flex-col gap-1">
              <h1 className="text-[22px] font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {mode === 'login'
                  ? 'Log in to post pickups and collect trash.'
                  : 'One account posts pickups and collects them.'}
              </p>
            </div>

            {/* Segmented toggle */}
            <div
              className="mb-6 flex rounded-full p-1"
              style={{
                background: 'color-mix(in srgb, var(--text-primary) 6%, transparent)',
                border: '1px solid var(--border)',
              }}
            >
              {['login', 'signup'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setMode(tab)
                    setLoginError('')
                    setSignupError('')
                  }}
                  className="tt-press flex-1 rounded-full py-2.5 text-[14px] font-bold"
                  style={
                    mode === tab
                      ? { background: 'var(--brand)', color: 'var(--on-brand)' }
                      : { color: 'var(--text-secondary)', background: 'transparent' }
                  }
                >
                  {tab === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />

                <FormError>{loginError}</FormError>

                <Button type="submit" full loading={loginLoading} className="mt-1" style={{ paddingBlock: 12 }}>
                  {loginLoading ? 'Logging in…' : 'Log in'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <Input
                  label="Full name"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="8+ chars, mixed case & a number"
                  required
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                />

                <FormError>{signupError}</FormError>

                <Button type="submit" full loading={signupLoading} className="mt-1" style={{ paddingBlock: 12 }}>
                  {signupLoading ? 'Creating account…' : 'Create account'}
                </Button>

                <p className="mt-1 text-center text-[12px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                  By continuing you agree to keep our neighborhoods clean. 🌱
                </p>
              </form>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
