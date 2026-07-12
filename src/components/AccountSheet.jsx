// Account settings — avatar, display name, email, password. Each section
// saves independently; all writes live in App.jsx and arrive as props.
import { useRef, useState } from 'react'
import { validateImage } from '../lib/validateImage'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import { Input } from './ui/Input'
import Sheet from './ui/Sheet'

function SectionLabel({ children }) {
  return (
    <p className="mb-2 mt-5 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

export default function AccountSheet({
  open,
  onClose,
  currentUser,
  profile,
  onUploadAvatar,
  onSaveName,
  onChangeEmail,
  onChangePassword,
}) {
  const fileRef = useRef(null)
  const [avatarError, setAvatarError] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [name, setName] = useState(profile?.name ?? currentUser?.name ?? '')
  const [savingName, setSavingName] = useState(false)

  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [savingEmail, setSavingEmail] = useState(false)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwError, setPwError] = useState(null)
  const [savingPw, setSavingPw] = useState(false)

  const nameDirty = name.trim() !== (profile?.name ?? currentUser?.name ?? '') && name.trim().length > 0
  const emailDirty = email.trim() !== (currentUser?.email ?? '') && email.includes('@')

  async function pickAvatar(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const invalid = validateImage(file)
    setAvatarError(invalid)
    if (invalid) return
    setUploading(true)
    await onUploadAvatar(file)
    setUploading(false)
  }

  async function saveName() {
    if (!nameDirty || savingName) return
    setSavingName(true)
    await onSaveName(name)
    setSavingName(false)
  }

  async function saveEmail() {
    if (!emailDirty || savingEmail) return
    setSavingEmail(true)
    await onChangeEmail(email.trim())
    setSavingEmail(false)
  }

  async function savePassword() {
    if (savingPw) return
    if (pw.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    if (pw !== pw2) { setPwError('Passwords do not match.'); return }
    setPwError(null)
    setSavingPw(true)
    await onChangePassword(pw)
    setSavingPw(false)
    setPw('')
    setPw2('')
  }

  return (
    <Sheet open={open} title="Account settings" onClose={onClose}>
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="tt-press relative flex-shrink-0 rounded-full"
          onClick={() => fileRef.current?.click()}
          aria-label="Change profile photo"
          disabled={uploading}
        >
          <Avatar name={currentUser?.name || 'You'} src={profile?.avatar_url} size="lg" />
          <span
            className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full"
            style={{ background: 'var(--brand)', color: 'var(--on-brand)', boxShadow: 'var(--shadow-card)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {uploading ? 'Uploading…' : 'Profile photo'}
          </p>
          <p className="text-[12px]" style={{ color: avatarError ? 'var(--danger)' : 'var(--text-muted)' }}>
            {avatarError ?? 'JPEG or PNG, up to 5 MB.'}
          </p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={pickAvatar} />
      </div>

      {/* Display name */}
      <SectionLabel>Display name</SectionLabel>
      <div className="flex flex-col gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={60} />
        <Button full disabled={!nameDirty} loading={savingName} onClick={saveName}>
          Save name
        </Button>
      </div>

      {/* Email */}
      <SectionLabel>Email</SectionLabel>
      <div className="flex flex-col gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          hint="We'll send a confirmation link before the change takes effect."
        />
        <Button full variant="secondary" disabled={!emailDirty} loading={savingEmail} onClick={saveEmail}>
          Change email
        </Button>
      </div>

      {/* Password */}
      <SectionLabel>Password</SectionLabel>
      <div className="flex flex-col gap-2">
        <Input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
        />
        <Input
          type="password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          error={pwError}
        />
        <Button full variant="secondary" disabled={pw.length === 0} loading={savingPw} onClick={savePassword}>
          Change password
        </Button>
      </div>
    </Sheet>
  )
}
