import { useState } from 'react'
import { mockUsers } from '../data/users'

// In-memory registry — survives within the session but resets on page refresh
const userRegistry = [...mockUsers]

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Signup state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [signupRole, setSignupRole] = useState('poster')
  const [signupError, setSignupError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    setLoginError('')

    const user = userRegistry.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        u.password === loginPassword
    )

    if (!user) {
      setLoginError('Invalid email or password.')
      return
    }

    onLogin(user)
  }

  function handleSignup(e) {
    e.preventDefault()
    setSignupError('')

    if (!signupName.trim()) return setSignupError('Name is required.')
    if (!signupEmail.trim()) return setSignupError('Email is required.')
    if (signupPassword.length < 6) return setSignupError('Password must be at least 6 characters.')
    if (signupPassword !== signupConfirm) return setSignupError('Passwords do not match.')

    const exists = userRegistry.find(
      (u) => u.email.toLowerCase() === signupEmail.trim().toLowerCase()
    )
    if (exists) return setSignupError('An account with this email already exists.')

    const newUser = {
      id: `u${Date.now()}`,
      name: signupName.trim(),
      email: signupEmail.trim().toLowerCase(),
      password: signupPassword,
      defaultRole: signupRole,
    }
    userRegistry.push(newUser)
    onLogin(newUser)
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
        <h1 className="font-bold text-2xl" style={{ color: '#0d3320' }}>
          TrashTag <span style={{ color: '#c97f1e' }} className="text-base font-semibold">PH</span>
        </h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-[390px] bg-white rounded-2xl shadow-sm p-6">
        {/* Tab toggle */}
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
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-1"
              style={{ background: '#0d3320' }}
            >
              Log In
            </button>

            {/* Demo hint */}
            <p className="text-xs text-center mt-1" style={{ color: '#9ca3af' }}>
              Demo: <span className="font-medium">juan@test.com</span> / <span className="font-medium">password123</span>
            </p>
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

            {/* Role picker */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color: '#374151' }}>
                I want to…
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'poster', label: '🏠 Post Requests' },
                  { value: 'collector', label: '♻️ Collect Trash' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSignupRole(opt.value)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all"
                    style={
                      signupRole === opt.value
                        ? { borderColor: '#0d3320', background: '#0d3320', color: 'white' }
                        : { borderColor: '#e5e7eb', color: '#374151' }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {signupError && (
              <p className="text-xs text-red-500 text-center">{signupError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-1"
              style={{ background: '#c97f1e' }}
            >
              Create Account
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
