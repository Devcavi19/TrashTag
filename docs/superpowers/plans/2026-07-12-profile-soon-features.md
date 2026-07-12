# Profile "Soon" Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ProfileView's three "Soon" rows with a working Account settings sheet (avatar/name/email/password), a Notifications prefs sheet whose toggles gate real in-app alert toasts, and a static Community guidelines sheet.

**Architecture:** Three bottom-sheets on the existing `Sheet` primitive, rendered from ProfileView. All Supabase writes are new mutators in `App.jsx` threaded down as props (the `savePaymentDetails` pattern: write → `fetchAllProfiles()` → toast). One migration adds `profiles.notification_prefs` (jsonb) and the `avatars` storage bucket. Alerts fire from `App.jsx` by diffing realtime-updated state plus one new global `messages` INSERT subscription (RLS-scoped).

**Tech Stack:** React 19 + Vite, Supabase (Postgres/Auth/Storage/Realtime), Tailwind v4 with design tokens.

**Spec:** `docs/superpowers/specs/2026-07-12-profile-soon-features-design.md`

## Global Constraints

- **No test runner exists.** Verification = `npm run lint`, `npm run build`, and `/preview.html` fixture screens (`npm run dev`, then e.g. `http://localhost:5173/preview.html?screen=guidelines&theme=bold-impact`).
- **Never hardcode hex in components** — every color through a CSS design token (`var(--…)`).
- **Mutators live in App.jsx** and are threaded down as props; components never call Supabase for writes.
- User-facing copy says **"Green Collector"**; code identifiers keep `collector`/`poster` naming.
- The app shell is 430px max-width; `Sheet` is the single modal idiom.
- Animations must be reduced-motion aware (follow the `.tt-*` pattern in `src/index.css`).
- Commit after each task with a conventional-commit message.

---

### Task 1: Database migration — `notification_prefs` column + `avatars` bucket

**Files:**
- Create: `supabase/migrations/20260712000000_profile_soon_features.sql` (repo record; create `supabase/migrations/` if absent)

**Interfaces:**
- Produces: `profiles.notification_prefs` jsonb (default `{"jobUpdates": true, "messages": true, "community": true}`), public `avatars` storage bucket writable only inside the caller's own `{uid}/` folder.

- [ ] **Step 1: Write the migration SQL file**

```sql
-- Profile "Soon" features: notification prefs + avatar storage.
alter table public.profiles
  add column notification_prefs jsonb not null
  default '{"jobUpdates": true, "messages": true, "community": true}';

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy "Avatar upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatar update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatar delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__supabase__list_projects` to find the project ref, then `mcp__supabase__apply_migration` with name `profile_soon_features` and the SQL above. (The MCP goes over the HTTPS management API, so the network's blocked Postgres protocol does not apply.)

**Fallback:** if the MCP call fails, print the SQL and ask the user to run it in the Supabase dashboard SQL editor, then wait for confirmation before continuing.

- [ ] **Step 3: Verify**

Run `mcp__supabase__execute_sql` with:
```sql
select column_name from information_schema.columns
  where table_name = 'profiles' and column_name = 'notification_prefs';
select id, public from storage.buckets where id = 'avatars';
```
Expected: one row each (`notification_prefs`; `avatars | true`).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260712000000_profile_soon_features.sql
git commit -m "feat: add notification_prefs column and avatars bucket"
```

---

### Task 2: `Toggle` ui primitive

**Files:**
- Create: `src/components/ui/Toggle.jsx`
- Modify: `src/index.css` (add `.tt-toggle-knob` near the other `.tt-*` rules)

**Interfaces:**
- Produces: `Toggle({ checked, onChange, label, sub })` — full-width row with label, optional sub-label, and a switch; `onChange(nextBoolean)`.

- [ ] **Step 1: Add the reduced-motion-aware knob transition to `src/index.css`**

Place next to the existing `.tt-*` interactive classes:

```css
.tt-toggle-knob {
  transition: transform 0.18s ease;
}
@media (prefers-reduced-motion: reduce) {
  .tt-toggle-knob {
    transition: none;
  }
}
```

- [ ] **Step 2: Create `src/components/ui/Toggle.jsx`**

```jsx
// Switch row: label + optional sub-label on the left, pill switch on the
// right. Purely controlled — parent owns the value and persistence.
export default function Toggle({ checked, onChange, label, sub }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 py-3 text-left"
      style={{ background: 'transparent' }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        {sub && (
          <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {sub}
          </span>
        )}
      </span>
      <span
        aria-hidden
        className="relative inline-flex h-[26px] w-[46px] flex-shrink-0 items-center rounded-full"
        style={{
          background: checked
            ? 'var(--brand)'
            : 'color-mix(in srgb, var(--text-primary) 18%, transparent)',
          transition: 'background 0.18s ease',
        }}
      >
        <span
          className="tt-toggle-knob absolute h-[20px] w-[20px] rounded-full"
          style={{
            background: 'var(--surface-card)',
            transform: checked ? 'translateX(23px)' : 'translateX(3px)',
            boxShadow: 'var(--shadow-card)',
          }}
        />
      </span>
    </button>
  )
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint` — expected: passes.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Toggle.jsx src/index.css
git commit -m "feat: add Toggle ui primitive"
```

---

### Task 3: `GuidelinesSheet` + ProfileView row + preview screen

**Files:**
- Create: `src/components/GuidelinesSheet.jsx`
- Modify: `src/components/ProfileView.jsx` (guidelines row + render sheet)
- Modify: `src/dev/preview.jsx` (add `guidelines` screen)

**Interfaces:**
- Produces: `GuidelinesSheet({ open, onClose })` — static content, no data props.

- [ ] **Step 1: Create `src/components/GuidelinesSheet.jsx`**

```jsx
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
        Linisa works because strangers trust each other with real money and real work.
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
        For behavior that breaks these guidelines, contact the Linisa team.
      </Footnote>

      <Footnote heading="Enforcement">
        Breaking these guidelines leads to a warning, then temporary suspension,
        then removal — depending on severity. We&apos;ll always tell you why.
      </Footnote>
    </Sheet>
  )
}
```

- [ ] **Step 2: Wire the ProfileView row**

In `src/components/ProfileView.jsx`:

Add the import next to `CredentialSheet`:
```jsx
import GuidelinesSheet from './GuidelinesSheet'
```

Add state next to `idOpen`:
```jsx
const [guideOpen, setGuideOpen] = useState(false)
```

Replace the Community guidelines `ActionRow`'s props (icon stays as-is):
```jsx
          <ActionRow
            label="Community guidelines"
            onClick={() => setGuideOpen(true)}
```
(i.e. delete `hint="Soon"` and the `onNotice(...)` handler.)

Render the sheet next to `CredentialSheet` at the bottom:
```jsx
      <GuidelinesSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
```

- [ ] **Step 3: Add the preview screen**

In `src/dev/preview.jsx`: import `GuidelinesSheet from '../components/GuidelinesSheet'`, add to `SCREENS`:
```jsx
  guidelines: <GuidelinesSheet open onClose={() => {}} />,
```
and extend the screens list in the header comment (line 6) with `|guidelines`.

- [ ] **Step 4: Verify visually**

Run: `npm run dev` (background), open `http://localhost:5173/preview.html?screen=guidelines` and `...&theme=bold-impact`. Expected: sheet with intro, six numbered principles, reporting + enforcement footnotes, legible in both themes. Also `npm run lint` passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/GuidelinesSheet.jsx src/components/ProfileView.jsx src/dev/preview.jsx
git commit -m "feat: community guidelines sheet"
```

---

### Task 4: `AccountSheet` + App.jsx account mutators + ProfileView wiring + preview

**Files:**
- Create: `src/components/AccountSheet.jsx`
- Modify: `src/App.jsx` (four mutators, pass props to ProfileView)
- Modify: `src/components/ProfileView.jsx` (row + hero avatar `src` + render sheet)
- Modify: `src/dev/preview.jsx` (add `settings` screen)

**Interfaces:**
- Consumes: `validateImage(file)` from `src/lib/validateImage.js` (returns error string or null); `Avatar` `src` prop; `Sheet`, `Input`, `Button` primitives.
- Produces: `AccountSheet({ open, onClose, currentUser, profile, onUploadAvatar, onSaveName, onChangeEmail, onChangePassword })`. App.jsx: `uploadAvatar(file)`, `saveAccountName(name)`, `changeEmail(email)`, `changePassword(password)` — all async.

- [ ] **Step 1: Add the four mutators to `src/App.jsx`**

Import at top: `import { validateImage } from './lib/validateImage'`.

Insert after `savePaymentDetails` (line ~183):

```jsx
  // --- Account settings (sheet in ProfileView) ---

  async function uploadAvatar(file) {
    const uid = currentUser?.id
    if (!uid || !file) return
    const invalid = validateImage(file)
    if (invalid) { setNotice(invalid); return }
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${uid}/${Date.now()}.${ext}`
    const { data: uploadData, error } = await supabase.storage.from('avatars').upload(path, file)
    if (error || !uploadData) { setNotice('Avatar upload failed — try again.'); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(uploadData.path)
    const { error: saveError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', uid)
    if (saveError) { setNotice('Could not save your avatar.'); return }
    await fetchAllProfiles()
    setNotice('Avatar updated.')
  }

  async function saveAccountName(name) {
    const uid = currentUser?.id
    const trimmed = name?.trim()
    if (!uid || !trimmed) return
    const { error } = await supabase.from('profiles').update({ name: trimmed }).eq('id', uid)
    if (error) { setNotice('Could not save your name.'); return }
    // Sign-up stores the name in auth metadata too — keep them in sync.
    await supabase.auth.updateUser({ data: { name: trimmed } })
    setCurrentUser((u) => ({ ...u, name: trimmed }))
    await fetchAllProfiles()
    setNotice('Name updated.')
  }

  async function changeEmail(email) {
    const { error } = await supabase.auth.updateUser({ email })
    if (error) { setNotice(error.message); return }
    setNotice('Check your inbox to confirm the email change.')
  }

  async function changePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setNotice(error.message); return }
    setNotice('Password updated.')
  }
```

Pass to ProfileView (inside the existing `view === 'you'` block):
```jsx
            onUploadAvatar={uploadAvatar}
            onSaveName={saveAccountName}
            onChangeEmail={changeEmail}
            onChangePassword={changePassword}
```

- [ ] **Step 2: Create `src/components/AccountSheet.jsx`**

```jsx
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
```

- [ ] **Step 3: Wire ProfileView**

In `src/components/ProfileView.jsx`:

Import: `import AccountSheet from './AccountSheet'`.

Extend the props destructuring with `onUploadAvatar, onSaveName, onChangeEmail, onChangePassword` (keep the rest).

Add state: `const [acctOpen, setAcctOpen] = useState(false)`.

Hero avatar gets the uploaded photo — change the `Avatar` in the identity hero to:
```jsx
          <Avatar name={currentUser?.name || 'You'} src={profile?.avatar_url} size="lg" className="flex-shrink-0 text-xl" style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }} />
```

Replace the Account settings `ActionRow` props (icon stays):
```jsx
          <ActionRow
            label="Account settings"
            onClick={() => setAcctOpen(true)}
```

Render next to the other sheets at the bottom:
```jsx
      <AccountSheet
        open={acctOpen}
        onClose={() => setAcctOpen(false)}
        currentUser={currentUser}
        profile={profile}
        onUploadAvatar={onUploadAvatar}
        onSaveName={onSaveName}
        onChangeEmail={onChangeEmail}
        onChangePassword={onChangePassword}
      />
```

- [ ] **Step 4: Add the preview screen**

In `src/dev/preview.jsx`: import `AccountSheet from '../components/AccountSheet'`, add to `SCREENS` and to the header comment (`|settings`):
```jsx
  settings: (
    <AccountSheet
      open
      onClose={() => {}}
      currentUser={{ ...FIXTURE_USER, email: 'herald@example.com' }}
      profile={{ id: 'u-herald', name: 'Herald', avatar_url: null }}
      onUploadAvatar={async () => {}}
      onSaveName={async () => {}}
      onChangeEmail={async () => {}}
      onChangePassword={async () => {}}
    />
  ),
```

- [ ] **Step 5: Verify**

`npm run lint` passes. Preview `?screen=settings` in both themes: avatar block with camera badge, three sections, buttons disabled until dirty. Password mismatch shows inline error (type mismatched values, click Change password).

- [ ] **Step 6: Commit**

```bash
git add src/components/AccountSheet.jsx src/components/ProfileView.jsx src/App.jsx src/dev/preview.jsx
git commit -m "feat: account settings sheet (avatar, name, email, password)"
```

---

### Task 5: Notification prefs — lib, `NotificationsSheet`, App plumbing, preview

**Files:**
- Create: `src/lib/notificationPrefs.js`
- Create: `src/components/NotificationsSheet.jsx`
- Modify: `src/App.jsx` (select columns, `saveNotificationPrefs`, pass props)
- Modify: `src/components/ProfileView.jsx` (row + render sheet)
- Modify: `src/dev/preview.jsx` (add `notifprefs` screen)

**Interfaces:**
- Consumes: `Toggle` from Task 2; `profiles.notification_prefs` from Task 1.
- Produces: `DEFAULT_PREFS` and `prefsOf(profile)` in `src/lib/notificationPrefs.js`; `NotificationsSheet({ open, onClose, prefs, onSave })` where `onSave(nextPrefs)` resolves to `true`/`false`; App.jsx `saveNotificationPrefs(prefs) → boolean` and `myPrefs` (used again in Task 6).

- [ ] **Step 1: Create `src/lib/notificationPrefs.js`**

```js
// In-app alert preferences, stored per-user in profiles.notification_prefs.
// Merging over defaults keeps older rows (or a partial jsonb) safe.
export const DEFAULT_PREFS = { jobUpdates: true, messages: true, community: true }

export function prefsOf(profile) {
  return { ...DEFAULT_PREFS, ...(profile?.notification_prefs ?? {}) }
}
```

- [ ] **Step 2: Create `src/components/NotificationsSheet.jsx`**

```jsx
// Notification preferences — three switches gating the in-app alert toasts.
// Optimistic: flip immediately, write through onSave, revert if it fails.
import { useState } from 'react'
import Sheet from './ui/Sheet'
import Toggle from './ui/Toggle'

const ROWS = [
  { key: 'jobUpdates', label: 'Job updates', sub: 'Pickup accepted, cleanup proof, payment' },
  { key: 'messages', label: 'Messages', sub: 'New chat messages on your pickups' },
  { key: 'community', label: 'Community', sub: 'New posts and events in the feed' },
]

export default function NotificationsSheet({ open, onClose, prefs, onSave }) {
  const [local, setLocal] = useState(prefs)

  async function toggle(key) {
    const next = { ...local, [key]: !local[key] }
    setLocal(next)
    const ok = await onSave(next)
    if (!ok) setLocal(local)
  }

  return (
    <Sheet open={open} title="Notifications" onClose={onClose}>
      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
        Alerts show inside the app while you&apos;re using it.
      </p>
      <div className="mt-1">
        {ROWS.map((row, i) => (
          <div key={row.key}>
            {i > 0 && <div className="h-px" style={{ background: 'var(--border)' }} />}
            <Toggle checked={local[row.key]} onChange={() => toggle(row.key)} label={row.label} sub={row.sub} />
          </div>
        ))}
      </div>
    </Sheet>
  )
}
```

- [ ] **Step 3: App.jsx plumbing**

Import: `import { prefsOf } from './lib/notificationPrefs'`.

Add `notification_prefs` to **both** profile select lists (`fetchProfile` and `fetchAllProfiles`):
```js
.select('id, name, gcash_number, maya_number, verified_at, avatar_url, created_at, notification_prefs')
```

Add the mutator after the account mutators:
```jsx
  // Returns success so the sheet can revert its optimistic flip on failure.
  async function saveNotificationPrefs(prefs) {
    const uid = currentUser?.id
    if (!uid) return false
    const { error } = await supabase.from('profiles').update({ notification_prefs: prefs }).eq('id', uid)
    if (error) { setNotice('Could not save notification settings.'); return false }
    await fetchAllProfiles()
    return true
  }
```

Derive prefs next to `userStats` (after the `myId` line):
```jsx
  const myPrefs = prefsOf(profiles.find((p) => p.id === myId))
```

Pass to ProfileView:
```jsx
            notificationPrefs={myPrefs}
            onSaveNotificationPrefs={saveNotificationPrefs}
```

- [ ] **Step 4: Wire ProfileView**

Import: `import NotificationsSheet from './NotificationsSheet'`.

Extend props destructuring with `notificationPrefs, onSaveNotificationPrefs`.

Add state: `const [notifOpen, setNotifOpen] = useState(false)`.

Replace the Notifications `ActionRow` props (icon stays):
```jsx
          <ActionRow
            label="Notifications"
            onClick={() => setNotifOpen(true)}
```

Render next to the other sheets — the `key` remounts the sheet when saved prefs
round-trip, keeping local state in sync (same pattern as `PaymentDetails`):
```jsx
      <NotificationsSheet
        key={JSON.stringify(notificationPrefs)}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        prefs={notificationPrefs}
        onSave={onSaveNotificationPrefs}
      />
```

All three rows no longer use `onNotice` — remove it from ProfileView's props
destructuring, and remove `onNotice={setNotice}` from the `<ProfileView …>`
call in `src/App.jsx` (nothing else consumes it).

- [ ] **Step 5: Add the preview screen**

In `src/dev/preview.jsx`: import `NotificationsSheet from '../components/NotificationsSheet'`, add to `SCREENS` and the header comment (`|notifprefs`):
```jsx
  notifprefs: (
    <NotificationsSheet
      open
      onClose={() => {}}
      prefs={{ jobUpdates: true, messages: true, community: false }}
      onSave={async () => true}
    />
  ),
```

Also update the existing `profile` screen's `<ProfileView …>` fixture: delete
`onNotice={() => {}}` and add the new props so the sheets work when tapped:
```jsx
          onUploadAvatar={async () => {}}
          onSaveName={async () => {}}
          onChangeEmail={async () => {}}
          onChangePassword={async () => {}}
          notificationPrefs={{ jobUpdates: true, messages: true, community: true }}
          onSaveNotificationPrefs={async () => true}
```

- [ ] **Step 6: Verify**

`npm run lint` passes. Preview `?screen=notifprefs` in both themes: three rows, Community off; clicking flips switches (fixture onSave always succeeds).

- [ ] **Step 7: Commit**

```bash
git add src/lib/notificationPrefs.js src/components/NotificationsSheet.jsx src/App.jsx src/components/ProfileView.jsx src/dev/preview.jsx
git commit -m "feat: notification preferences sheet"
```

---

### Task 6: In-app alert firing in App.jsx

**Files:**
- Modify: `src/App.jsx` only

**Interfaces:**
- Consumes: `myPrefs` from Task 5; `requests`/`posts` realtime state; `activeThreadPeer` state; `setNotice`.
- Produces: nothing new for later tasks — behavior only.

- [ ] **Step 1: Add `useRef` to the React import**

```jsx
import { useState, useEffect, useRef } from 'react'
```

- [ ] **Step 2: Job-update alerts — status-transition diff effect**

Insert after the `myPrefs` derivation. The ref starts `null` so the initial fetch populates it without toasting; every branch fires only for transitions the *other* party caused (the poster never sets `accepted`/`collected`/`paid`; the collector never sets `payment_sent`/`disputed`).

```jsx
  // In-app alerts: toast when the other party moves one of my jobs. The ref
  // holds the previous {id → status} map; first population never toasts.
  const prevStatusesRef = useRef(null)
  useEffect(() => {
    if (!myId || requests.length === 0) { prevStatusesRef.current = null; return }
    const prev = prevStatusesRef.current
    prevStatusesRef.current = new Map(requests.map((r) => [r.id, r.status]))
    if (!prev || !myPrefs.jobUpdates) return
    for (const r of requests) {
      const before = prev.get(r.id)
      if (!before || before === r.status) continue
      if (r.postedBy === myId) {
        if (r.status === 'accepted') setNotice('A Green Collector accepted your pickup — say hi in Messages.')
        if (r.status === 'collected' && before === 'payment_sent') setNotice("The Green Collector hasn't received your payment — please resend.")
        else if (r.status === 'collected') setNotice('Cleanup proof uploaded — review it in Messages.')
        if (r.status === 'paid') setNotice('Payment confirmed — pickup complete. 🎉')
      }
      if (r.collectedBy === myId) {
        if (r.status === 'payment_sent') setNotice('Payment sent — confirm receipt in Messages.')
        if (r.status === 'disputed') setNotice('Your cleanup proof was rejected — please re-upload.')
      }
    }
  }, [requests, myId, myPrefs.jobUpdates])
```

- [ ] **Step 3: Message alerts — global RLS-scoped subscription**

Refs keep the channel stable while prefs/thread/profiles change:

```jsx
  // New-message alerts. RLS already limits messages to requests I'm part of,
  // so a table-wide subscription only ever delivers my own conversations.
  // Refs keep the channel subscription stable across renders.
  const msgAlertRef = useRef({ pref: true, openPeer: null, profiles: [] })
  msgAlertRef.current = { pref: myPrefs.messages, openPeer: activeThreadPeer, profiles }

  useEffect(() => {
    if (!myId) return
    const channel = supabase
      .channel('app-message-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const { sender_id } = payload.new
          const { pref, openPeer, profiles: people } = msgAlertRef.current
          if (!pref || sender_id === myId || sender_id === openPeer) return
          const sender = people.find((p) => p.id === sender_id)
          setNotice(`New message from ${sender?.name ?? 'your pickup partner'}.`)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [myId])
```

- [ ] **Step 4: Community alerts — new-post diff effect**

```jsx
  // New community posts by others. Same first-load-silent pattern as jobs.
  const knownPostIdsRef = useRef(null)
  useEffect(() => {
    if (posts.length === 0) return
    const prev = knownPostIdsRef.current
    knownPostIdsRef.current = new Set(posts.map((p) => p.id))
    if (!prev || !myId || !myPrefs.community) return
    for (const p of posts) {
      if (!prev.has(p.id) && p.authorId !== myId) {
        setNotice('New in Community — take a look.')
        break
      }
    }
  }, [posts, myId, myPrefs.community])
```

- [ ] **Step 5: Verify**

`npm run lint` and `npm run build` pass. Live check (needs `.env` + the Herald/Carl test accounts, Password123 — see memory):
1. Sign in as Herald in the app (`npm run dev`). Sign in as Carl via a second browser profile or the `scripts/verify-*.mjs` Node pattern.
2. Carl accepts one of Herald's `open` requests → Herald sees "A Green Collector accepted your pickup…" toast.
3. Carl sends a chat message while Herald's thread with Carl is closed → toast with Carl's name; with the thread open → no toast.
4. Turn Job updates off in Herald's Notifications sheet, repeat a transition → no toast.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: in-app alert toasts gated by notification prefs"
```

---

### Task 7: Docs, lint/build, final visual pass

**Files:**
- Modify: `CLAUDE.md` (data model + storage buckets + styling preview line)

**Interfaces:** none — documentation and verification only.

- [ ] **Step 1: Update CLAUDE.md**

- `profiles` row description: add `notification_prefs` (jsonb, in-app alert toggles) after `verified_at`.
- Storage buckets line: add `avatars` (profile photos).
- Preview screens list: append `settings|notifprefs|guidelines`.
- In the ProfileView/App flow paragraph, no change needed unless a sentence mentions "coming soon".

- [ ] **Step 2: Full gate**

Run: `npm run lint` → passes. `npm run build` → succeeds.

- [ ] **Step 3: Visual sweep**

Preview all three new screens in both themes (6 URLs), plus `?screen=profile` to confirm the Soon chips are gone and rows open sheets (profile screen uses fixtures, sheets open on tap).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document account settings, notification prefs, guidelines"
```
