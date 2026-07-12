import { useState, useEffect } from 'react'
import ngeohash from 'ngeohash'
import { useRequests } from './hooks/useRequests'
import { useFeed } from './hooks/useFeed'
import { useIdleLogout } from './hooks/useIdleLogout'
import { supabase } from './lib/supabase'
import { validateImage } from './lib/validateImage'
import { prefsOf } from './lib/notificationPrefs'
import { getStoredTheme, applyTheme, setStoredTheme } from './lib/themes'
import { deriveCredential } from './lib/collectorCred'
import HomeFeed from './components/HomeFeed'
import FeedView from './components/FeedView'
import LeaderboardView from './components/LeaderboardView'
import ProfileView from './components/ProfileView'
import Conversations from './components/Conversations'
import MessageThread from './components/MessageThread'
import ComposerModal from './components/ComposerModal'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import LoadingScreen from './components/LoadingScreen'
import AuthScreen from './components/AuthScreen'
import Landing from './components/Landing'
import Toast from './components/Toast'

function App() {
  const [appState, setAppState] = useState('loading') // 'loading' | 'auth' | 'app'
  const [currentUser, setCurrentUser] = useState(null)
  const [profiles, setProfiles] = useState([])

  const [view, setView] = useState('home') // 'home' | 'community' | 'leaderboard' | 'you'
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [activeThreadPeer, setActiveThreadPeer] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [authNotice, setAuthNotice] = useState(null)
  // Signed-out visitors see the landing page; the auth form is reached via its
  // CTAs (or directly after an explicit sign-out, when they already know the app).
  const [authView, setAuthView] = useState('landing') // 'landing' | 'form'
  const [authMode, setAuthMode] = useState('login') // initial tab for AuthScreen
  const [theme, setTheme] = useState(getStoredTheme)

  const [requests, realtimeStatus] = useRequests()
  const [posts] = useFeed()

  const realtimeDown = realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'TIMED_OUT'

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, gcash_number, maya_number, verified_at, avatar_url, created_at, notification_prefs')
      .eq('id', userId)
      .single()
    return data
  }

  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('id, name, gcash_number, maya_number, verified_at, avatar_url, created_at, notification_prefs')
    if (data) setProfiles(data)
  }

  // Auto-dismiss transient menu notices
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(t)
  }, [notice])

  // Listen for auth state changes — only act on explicit sign-out
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null)
        setProfiles([])
        setAppState('auth')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Called when the splash animation finishes — check for an existing session
  async function handleLoadingDone() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      setCurrentUser({ ...session.user, name: profile?.name })
      await fetchAllProfiles()
      setAppState('app')
    } else {
      setAppState('auth')
    }
  }

  async function handleLogin(authUser) {
    setAuthNotice(null)
    const profile = await fetchProfile(authUser.id)
    setCurrentUser({ ...authUser, name: profile?.name })
    await fetchAllProfiles()
    setAppState('app')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setProfiles([])
    setAuthView('form')
    setAuthMode('login')
    setAppState('auth')
  }

  // Auto sign-out after 10 minutes of inactivity while signed in.
  async function handleIdleLogout() {
    setAuthNotice('You were signed out after 10 minutes of inactivity.')
    await handleLogout()
  }
  useIdleLogout(appState === 'app', handleIdleLogout)

  async function addRequest(newReq) {
    const geohash =
      newReq.lat != null && newReq.lng != null
        ? ngeohash.encode(newReq.lat, newReq.lng, 9)
        : null
    await supabase.from('requests').insert({
      poster_id: currentUser?.id,
      photo_url: newReq.photo,
      location_label: newReq.label,
      location_lat: newReq.lat,
      location_lng: newReq.lng,
      location_geohash: geohash,
      tags: newReq.tags,
      price: newReq.price,
      status: 'open',
    })
  }

  async function updateStatus(id, newStatus) {
    const updates = { status: newStatus }
    if (newStatus === 'accepted') updates.collected_by = currentUser?.id
    await supabase.from('requests').update(updates).eq('id', id)
  }

  // Poster rejects the after-photo: back to the collector for a redo.
  async function handleRejectProof(id) {
    await supabase.from('requests').update({ status: 'disputed', after_photo_url: null }).eq('id', id)
  }

  // Dual-confirmation payment handshake (money moves outside the app).
  // Poster reports the payment as sent…
  async function markPaymentSent(id, method, reference) {
    await supabase.from('requests').update({
      status: 'payment_sent',
      payment_method: method,
      payment_reference: reference?.trim() || null,
      payment_sent_at: new Date().toISOString(),
    }).eq('id', id)
  }

  // …the collector confirms it landed…
  async function confirmPaymentReceived(id) {
    await supabase.from('requests').update({
      status: 'paid',
      payment_confirmed_at: new Date().toISOString(),
    }).eq('id', id)
  }

  // …or reports it missing, which reopens the poster's pay step.
  async function reportPaymentNotReceived(id) {
    await supabase.from('requests').update({
      status: 'collected',
      payment_method: null,
      payment_reference: null,
      payment_sent_at: null,
    }).eq('id', id)
  }

  // Collector saves their receiving details (shown to posters in the pay sheet).
  async function savePaymentDetails({ gcash, maya }) {
    const myId = currentUser?.id
    if (!myId) return
    await supabase.from('profiles').update({
      gcash_number: gcash?.trim() || null,
      maya_number: maya?.trim() || null,
    }).eq('id', myId)
    await fetchAllProfiles()
    setNotice('Payment details saved.')
  }

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

  // Returns success so the sheet can revert its optimistic flip on failure.
  async function saveNotificationPrefs(prefs) {
    const uid = currentUser?.id
    if (!uid) return false
    const { error } = await supabase.from('profiles').update({ notification_prefs: prefs }).eq('id', uid)
    if (error) { setNotice('Could not save notification settings.'); return false }
    await fetchAllProfiles()
    return true
  }

  async function handleAfterPhoto(id, file) {
    if (!file) return
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${id}/${Date.now()}.${ext}`
    const { data: uploadData, error } = await supabase.storage
      .from('after-photos')
      .upload(path, file)
    if (error || !uploadData) return
    const { data: { publicUrl } } = supabase.storage.from('after-photos').getPublicUrl(uploadData.path)
    await supabase.from('requests').update({ after_photo_url: publicUrl }).eq('id', id)
  }

  async function handleLike(requestId, userId) {
    const req = requests.find((r) => r.id === requestId)
    if (!req) return
    if (req.likes.includes(userId)) {
      await supabase.from('request_likes').delete().eq('request_id', requestId).eq('user_id', userId)
    } else {
      await supabase.from('request_likes').insert({ request_id: requestId, user_id: userId })
    }
  }

  // by: 'poster' writes requests.rating; 'collector' writes requests.collector_rating
  async function handleRate(id, stars, by) {
    const column = by === 'collector' ? 'collector_rating' : 'rating'
    await supabase.from('requests').update({ [column]: stars }).eq('id', id)
  }

  async function addPost(newPost) {
    await supabase.from('posts').insert({ ...newPost, author_id: currentUser?.id })
  }

  async function handlePostLike(postId, userId) {
    if (!userId) return
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    if (post.likes.includes(userId)) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
    }
  }

  // Jobs I'm part of that are still in motion — drives the Messages badge.
  const myId = currentUser?.id
  const myPrefs = prefsOf(profiles.find((p) => p.id === myId))
  const activeConvoCount = requests.filter(
    (r) =>
      (r.postedBy === myId || r.collectedBy === myId) &&
      ['accepted', 'collected', 'disputed', 'payment_sent'].includes(r.status)
  ).length

  // Real impact ledger for the account menu — derived from live requests, no fake numbers.
  const myRatings = requests.filter(
    (r) => r.collectedBy === myId && r.rating != null
  )
  const userStats = {
    posted: requests.filter((r) => r.postedBy === myId).length,
    collected: requests.filter(
      (r) => r.collectedBy === myId && ['collected', 'paid'].includes(r.status)
    ).length,
    ratingCount: myRatings.length,
    rating: myRatings.length
      ? myRatings.reduce((sum, r) => sum + r.rating, 0) / myRatings.length
      : 0,
  }

  // Green Collector credential lookup — one derivation, every trust surface.
  function credentialFor(userId) {
    const profile = profiles.find((p) => p.id === userId)
    return profile ? { profile, credential: deriveCredential(requests, profile) } : null
  }

  function handleThemeChange(id) {
    setTheme(id)
    applyTheme(id)
    setStoredTheme(id)
  }

  // A conversation is a person, not a pickup. Opening any pickup with someone
  // opens the single shared thread with that person.
  function openThread(request) {
    const peer = request.postedBy === myId ? request.collectedBy : request.postedBy
    if (peer) setActiveThreadPeer(peer)
  }

  // Every non-open pickup I share with the active counterpart, newest first —
  // one chat, many pickup collections.
  const activeThreadRequests = activeThreadPeer
    ? requests
        .filter(
          (r) =>
            r.status !== 'open' &&
            ((r.postedBy === myId && r.collectedBy === activeThreadPeer) ||
              (r.collectedBy === myId && r.postedBy === activeThreadPeer))
        )
        .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt))
    : []

  if (appState === 'loading') {
    return <LoadingScreen onDone={handleLoadingDone} />
  }

  if (appState === 'auth') {
    if (authView === 'landing') {
      return (
        <Landing
          onGetStarted={() => { setAuthMode('signup'); setAuthView('form') }}
          onLogIn={() => { setAuthMode('login'); setAuthView('form') }}
        />
      )
    }
    return (
      <AuthScreen
        onLogin={handleLogin}
        notice={authNotice}
        initialMode={authMode}
        onBack={() => setAuthView('landing')}
      />
    )
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--surface)' }}>
      <TopBar />

      <main className="max-w-[430px] mx-auto pb-24">
        {view === 'home' && (
          <HomeFeed
            requests={requests}
            currentUser={currentUser}
            onCompose={() => setComposerOpen(true)}
            onAccept={(id) => updateStatus(id, 'accepted')}
            onLike={handleLike}
            onOpenThread={openThread}
            credentialFor={credentialFor}
          />
        )}
        {view === 'community' && (
          <FeedView
            posts={posts}
            addPost={addPost}
            onLike={handlePostLike}
            currentUser={currentUser}
          />
        )}
        {view === 'leaderboard' && (
          <LeaderboardView
            requests={requests}
            users={profiles}
            currentUser={currentUser}
          />
        )}
        {view === 'you' && (
          <ProfileView
            currentUser={currentUser}
            profile={profiles.find((p) => p.id === myId)}
            requests={requests}
            stats={userStats}
            onLogout={handleLogout}
            onSavePaymentDetails={savePaymentDetails}
            onUploadAvatar={uploadAvatar}
            onSaveName={saveAccountName}
            onChangeEmail={changeEmail}
            onChangePassword={changePassword}
            notificationPrefs={myPrefs}
            onSaveNotificationPrefs={saveNotificationPrefs}
            credentialFor={credentialFor}
            theme={theme}
            onThemeChange={handleThemeChange}
          />
        )}
      </main>

      <BottomNav
        view={view}
        setView={setView}
        unreadCount={activeConvoCount}
        onOpenMessages={() => setMessagesOpen(true)}
      />

      {composerOpen && (
        <ComposerModal onClose={() => setComposerOpen(false)} onSubmit={addRequest} />
      )}

      {messagesOpen && !activeThreadPeer && (
        <Conversations
          requests={requests}
          currentUser={currentUser}
          users={profiles}
          onClose={() => setMessagesOpen(false)}
          onOpenThread={openThread}
        />
      )}

      {activeThreadPeer && activeThreadRequests.length > 0 && (
        <MessageThread
          requests={activeThreadRequests}
          counterpartId={activeThreadPeer}
          currentUser={currentUser}
          users={profiles}
          onClose={() => setActiveThreadPeer(null)}
          onUpdateStatus={updateStatus}
          onSubmitAfterPhoto={handleAfterPhoto}
          onRejectProof={handleRejectProof}
          onMarkPaymentSent={markPaymentSent}
          onConfirmPaymentReceived={confirmPaymentReceived}
          onPaymentNotReceived={reportPaymentNotReceived}
          onRate={handleRate}
          credentialFor={credentialFor}
        />
      )}

      <Toast message={realtimeDown ? 'Connection lost — reconnecting…' : null} />
      <Toast message={!realtimeDown ? notice : null} tone="info" />
    </div>
  )
}

export default App
