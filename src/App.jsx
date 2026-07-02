import { useState, useEffect } from 'react'
import ngeohash from 'ngeohash'
import { useRequests } from './hooks/useRequests'
import { useFeed } from './hooks/useFeed'
import { useIdleLogout } from './hooks/useIdleLogout'
import { supabase } from './lib/supabase'
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
import Toast from './components/Toast'

function App() {
  const [appState, setAppState] = useState('loading') // 'loading' | 'auth' | 'app'
  const [currentUser, setCurrentUser] = useState(null)
  const [profiles, setProfiles] = useState([])

  const [view, setView] = useState('home') // 'home' | 'community' | 'leaderboard' | 'you'
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [activeRequestId, setActiveRequestId] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [authNotice, setAuthNotice] = useState(null)

  const [requests, realtimeStatus] = useRequests()
  const [posts] = useFeed()

  const realtimeDown = realtimeStatus === 'CHANNEL_ERROR' || realtimeStatus === 'TIMED_OUT'

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userId)
      .single()
    return data
  }

  async function fetchAllProfiles() {
    const { data } = await supabase.from('profiles').select('id, name')
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

  // Poster reviews the after-photo: accept → paid, or reject → disputed (photo cleared)
  async function handlePayment(id, accept) {
    const updates = accept
      ? { status: 'paid' }
      : { status: 'disputed', after_photo_url: null }
    await supabase.from('requests').update(updates).eq('id', id)
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
  const activeConvoCount = requests.filter(
    (r) =>
      (r.postedBy === myId || r.collectedBy === myId) &&
      ['accepted', 'collected', 'disputed'].includes(r.status)
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

  function openThread(request) {
    setActiveRequestId(request.id)
  }

  const activeRequest = activeRequestId
    ? requests.find((r) => r.id === activeRequestId) ?? null
    : null

  if (appState === 'loading') {
    return <LoadingScreen onDone={handleLoadingDone} />
  }

  if (appState === 'auth') {
    return <AuthScreen onLogin={handleLogin} notice={authNotice} />
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: '#f3f4f2' }}>
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
            requests={requests}
            stats={userStats}
            onLogout={handleLogout}
            onNotice={setNotice}
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

      {messagesOpen && !activeRequest && (
        <Conversations
          requests={requests}
          currentUser={currentUser}
          users={profiles}
          onClose={() => setMessagesOpen(false)}
          onOpenThread={openThread}
        />
      )}

      {activeRequest && (
        <MessageThread
          request={activeRequest}
          currentUser={currentUser}
          users={profiles}
          onClose={() => setActiveRequestId(null)}
          onUpdateStatus={updateStatus}
          onSubmitAfterPhoto={handleAfterPhoto}
          onPayment={handlePayment}
          onRate={handleRate}
        />
      )}

      <Toast message={realtimeDown ? 'Connection lost — reconnecting…' : null} />
      <Toast message={!realtimeDown ? notice : null} tone="info" />
    </div>
  )
}

export default App
